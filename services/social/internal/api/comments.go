package api

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/mathieux51/estceque/services/social/internal/audio"
)

const maxNoteBytes = 20 << 20

type CommentView struct {
	ID           int64     `json:"id"`
	ParentID     *int64    `json:"parentId"`
	AtSeconds    *float32  `json:"atSeconds"`
	Body         string    `json:"body"`
	AudioURL     *string   `json:"audioUrl"`
	AudioSeconds *float32  `json:"audioSeconds"`
	CreatedAt    time.Time `json:"createdAt"`
	User         UserView  `json:"user"`
	CanDelete    bool      `json:"canDelete"`
}

const commentSelect = `
	SELECT c.id, c.parent_id, c.at_seconds, c.body, c.audio_key, c.audio_seconds, c.created_at,
		u.id, u.handle, u.display_name, u.avatar_key, s.owner_id
	FROM comments c JOIN users u ON u.id = c.user_id
		JOIN episodes e ON e.id = c.episode_id JOIN shows s ON s.id = e.show_id`

func (a *API) comments(r *http.Request, viewer int64, rest string, args ...any) ([]CommentView, error) {
	rows, err := a.DB.Query(r.Context(), commentSelect+" "+rest, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	list := []CommentView{}
	for rows.Next() {
		var c CommentView
		var audioKey, avatarKey *string
		var showOwner int64
		if err := rows.Scan(&c.ID, &c.ParentID, &c.AtSeconds, &c.Body, &audioKey, &c.AudioSeconds, &c.CreatedAt,
			&c.User.ID, &c.User.Handle, &c.User.DisplayName, &avatarKey, &showOwner); err != nil {
			return nil, err
		}
		c.AudioURL, c.User.AvatarURL = mediaURL(audioKey), mediaURL(avatarKey)
		// Authors delete their comments; creators moderate their episodes.
		c.CanDelete = viewer != 0 && (viewer == c.User.ID || viewer == showOwner)
		list = append(list, c)
	}
	return list, rows.Err()
}

func (a *API) listComments(w http.ResponseWriter, r *http.Request) error {
	id, err := pathID(r, "id")
	if err != nil {
		return err
	}
	list, err := a.comments(r, a.viewer(r), `WHERE c.episode_id = $1 ORDER BY c.created_at`, id)
	if err != nil {
		return err
	}
	return writeJSON(w, http.StatusOK, list)
}

// createComment takes a multipart form: body, atSeconds, parentId and an
// optional "audio" file recorded in the browser (audio note).
func (a *API) createComment(w http.ResponseWriter, r *http.Request) error {
	viewer, err := a.requireViewer(r)
	if err != nil {
		return err
	}
	episodeID, err := pathID(r, "id")
	if err != nil {
		return err
	}
	ctx := r.Context()
	var duration *float32
	if err := a.DB.QueryRow(ctx, `SELECT duration_seconds FROM episodes WHERE id = $1 AND status = 'ready'`, episodeID).
		Scan(&duration); err != nil {
		return err
	}
	r.Body = http.MaxBytesReader(nil, r.Body, maxNoteBytes+1<<16)
	if err := r.ParseMultipartForm(1 << 20); err != nil {
		return fail(http.StatusBadRequest, "Commentaire invalide ou note audio trop lourde.")
	}
	defer r.MultipartForm.RemoveAll() //nolint:errcheck
	body := strings.TrimSpace(r.FormValue("body"))
	if len([]rune(body)) > 2000 {
		return fail(http.StatusBadRequest, "Le commentaire fait au plus 2000 caractères.")
	}
	var at *float32
	if v := r.FormValue("atSeconds"); v != "" {
		f, err := strconv.ParseFloat(v, 32)
		if err != nil || f < 0 || (duration != nil && float32(f) > *duration+1) {
			return fail(http.StatusBadRequest, "Moment de l'épisode invalide.")
		}
		f32 := float32(f)
		at = &f32
	}
	var parentID *int64
	var parentAuthor int64
	if v := r.FormValue("parentId"); v != "" {
		pid, err := strconv.ParseInt(v, 10, 64)
		if err != nil {
			return fail(http.StatusBadRequest, "Réponse invalide.")
		}
		var parentEpisode int64
		var grandParent *int64
		if err := a.DB.QueryRow(ctx, `SELECT episode_id, user_id, parent_id FROM comments WHERE id = $1`, pid).
			Scan(&parentEpisode, &parentAuthor, &grandParent); err != nil || parentEpisode != episodeID {
			return fail(http.StatusBadRequest, "Réponse invalide.")
		}
		// Replies stay one level deep: answering a reply answers its thread.
		if grandParent != nil {
			pid = *grandParent
		}
		parentID = &pid
	}

	var audioKey *string
	var audioSeconds *float32
	if file, _, err := r.FormFile("audio"); err == nil {
		defer file.Close()
		key, seconds, err := a.storeNote(r, episodeID, file)
		if err != nil {
			return err
		}
		audioKey, audioSeconds = &key, &seconds
	}
	if body == "" && audioKey == nil {
		return fail(http.StatusBadRequest, "Écrivez un commentaire ou enregistrez une note audio.")
	}

	var commentID int64
	if err := a.DB.QueryRow(ctx, `INSERT INTO comments (episode_id, user_id, parent_id, at_seconds, body, audio_key, audio_seconds)
		VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
		episodeID, viewer, parentID, at, body, audioKey, audioSeconds).Scan(&commentID); err != nil {
		return err
	}
	owner, showID := a.episodeOwner(r, episodeID)
	ids := map[string]int64{"episode": episodeID, "show": showID, "comment": commentID}
	if parentID != nil {
		a.notify(ctx, parentAuthor, "reply", viewer, ids)
	}
	if parentAuthor != owner {
		a.notify(ctx, owner, "comment", viewer, ids)
	}
	list, err := a.comments(r, viewer, `WHERE c.id = $1`, commentID)
	if err != nil {
		return err
	}
	return writeJSON(w, http.StatusCreated, list[0])
}

// storeNote converts an audio note to MP3 and stores it.
func (a *API) storeNote(r *http.Request, episodeID int64, file io.Reader) (string, float32, error) {
	dir, err := os.MkdirTemp("", "note")
	if err != nil {
		return "", 0, err
	}
	defer os.RemoveAll(dir)
	in, out := filepath.Join(dir, "note.in"), filepath.Join(dir, "note.mp3")
	f, err := os.Create(in)
	if err != nil {
		return "", 0, err
	}
	if _, err := io.Copy(f, file); err != nil {
		f.Close()
		return "", 0, fail(http.StatusBadRequest, "Note audio trop lourde.")
	}
	if err := f.Close(); err != nil {
		return "", 0, err
	}
	if err := audio.VoiceNote(r.Context(), in, out); err != nil {
		a.Log.Warn("voice note", "err", err)
		return "", 0, fail(http.StatusBadRequest, "Note audio illisible.")
	}
	seconds, err := audio.Duration(r.Context(), out)
	if err != nil {
		return "", 0, err
	}
	if seconds < 0.3 {
		return "", 0, fail(http.StatusBadRequest, "Note audio trop courte.")
	}
	key := fmt.Sprintf("notes/%d/%d.mp3", episodeID, time.Now().UnixNano())
	return key, float32(seconds), a.Store.PutFile(r.Context(), key, out, "audio/mpeg")
}

func (a *API) deleteComment(w http.ResponseWriter, r *http.Request) error {
	viewer, err := a.requireViewer(r)
	if err != nil {
		return err
	}
	id, err := pathID(r, "id")
	if err != nil {
		return err
	}
	list, err := a.comments(r, viewer, `WHERE c.id = $1`, id)
	if err != nil {
		return err
	}
	if len(list) == 0 {
		return errNotFound
	}
	if !list[0].CanDelete {
		return errForbidden
	}
	// Replies go with their comment (ON DELETE CASCADE), and so do their notes.
	rows, err := a.DB.Query(r.Context(), `DELETE FROM comments WHERE id = $1 OR parent_id = $1 RETURNING audio_key`, id)
	if err != nil {
		return err
	}
	var keys []*string
	for rows.Next() {
		var k *string
		if err := rows.Scan(&k); err != nil {
			rows.Close()
			return err
		}
		keys = append(keys, k)
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return err
	}
	a.deleteLater(keys...)
	return noContent(w)
}
