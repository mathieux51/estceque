package api

import (
	"fmt"
	"net/http"
	"path"
	"strings"

	"github.com/mathieux51/estceque/services/social/internal/jobs"
)

const maxEpisodeBytes = 1 << 30

var audioExtensions = map[string]bool{
	".mp3": true, ".wav": true, ".m4a": true, ".aac": true, ".ogg": true, ".opus": true,
	".flac": true, ".webm": true, ".aiff": true, ".aif": true, ".mp4": true,
}

// episodeUploadURL gives the browser a signed URL to PUT an audio file
// directly into storage.
func (a *API) episodeUploadURL(w http.ResponseWriter, r *http.Request) error {
	viewer, err := a.requireViewer(r)
	if err != nil {
		return err
	}
	var body struct {
		Filename string `json:"filename"`
	}
	if err := readJSON(r, &body); err != nil {
		return err
	}
	ext := strings.ToLower(path.Ext(body.Filename))
	if !audioExtensions[ext] {
		return fail(http.StatusBadRequest, "Format audio non reconnu (MP3, WAV, M4A, OGG, FLAC...).")
	}
	token, _ := randomToken()
	key := fmt.Sprintf("uploads/%d/%s%s", viewer, token[:16], ext)
	u, err := a.Store.UploadURL(r.Context(), key)
	if err != nil {
		return err
	}
	return writeJSON(w, http.StatusOK, map[string]string{"key": key, "url": u})
}

// checkUpload makes sure the key is the viewer's own uploaded file.
func (a *API) checkUpload(r *http.Request, viewer int64, key string) error {
	if !strings.HasPrefix(key, fmt.Sprintf("uploads/%d/", viewer)) || strings.Contains(key, "..") {
		return fail(http.StatusBadRequest, "Fichier envoyé introuvable.")
	}
	size, err := a.Store.Size(r.Context(), key)
	if err != nil {
		return fail(http.StatusBadRequest, "Fichier envoyé introuvable.")
	}
	if size > maxEpisodeBytes {
		return fail(http.StatusBadRequest, "Fichier trop lourd (1 Go au plus).")
	}
	return nil
}

type episodeInput struct {
	Title       *string  `json:"title"`
	Description *string  `json:"description"`
	Tags        []string `json:"tags"`
	UploadKey   *string  `json:"uploadKey"`
}

func (in *episodeInput) validate() error {
	show := showInput{Title: in.Title, Description: in.Description, Tags: in.Tags}
	if err := show.validate(); err != nil {
		return err
	}
	in.Title, in.Tags = show.Title, show.Tags
	return nil
}

func (a *API) createEpisode(w http.ResponseWriter, r *http.Request) error {
	viewer, showID, _, err := a.ownShow(r)
	if err != nil {
		return err
	}
	var in episodeInput
	if err := readJSON(r, &in); err != nil {
		return err
	}
	if in.Title == nil || in.UploadKey == nil {
		return fail(http.StatusBadRequest, "Le titre et le fichier audio sont obligatoires.")
	}
	if err := in.validate(); err != nil {
		return err
	}
	if err := a.checkUpload(r, viewer, *in.UploadKey); err != nil {
		return err
	}
	if in.Description == nil {
		in.Description = new(string)
	}
	if in.Tags == nil {
		in.Tags = []string{}
	}
	ctx := r.Context()
	tx, err := a.DB.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx) //nolint:errcheck
	var id int64
	if err := tx.QueryRow(ctx, `INSERT INTO episodes (show_id, title, description, tags, original_key)
		VALUES ($1, $2, $3, $4, $5) RETURNING id`, showID, *in.Title, *in.Description, in.Tags, *in.UploadKey).
		Scan(&id); err != nil {
		return err
	}
	if err := jobs.Add(ctx, tx, jobs.ProcessEpisode, jobs.EpisodePayload{EpisodeID: id}); err != nil {
		return err
	}
	if err := tx.Commit(ctx); err != nil {
		return err
	}
	return a.writeEpisode(w, r, viewer, id, http.StatusCreated)
}

func (a *API) writeEpisode(w http.ResponseWriter, r *http.Request, viewer, id int64, status int) error {
	list, err := a.episodes(r.Context(), viewer, `WHERE e.id = $2 AND (e.status = 'ready' OR s.owner_id = $1)`, id)
	if err != nil {
		return err
	}
	if len(list) == 0 {
		return errNotFound
	}
	e := list[0]
	if err := a.DB.QueryRow(r.Context(), `SELECT coalesce(waveform, '{}') FROM episodes WHERE id = $1`, id).
		Scan(&e.Waveform); err != nil {
		return err
	}
	return writeJSON(w, status, e)
}

func (a *API) getEpisode(w http.ResponseWriter, r *http.Request) error {
	id, err := pathID(r, "id")
	if err != nil {
		return err
	}
	return a.writeEpisode(w, r, a.viewer(r), id, http.StatusOK)
}

// ownEpisode checks that the viewer owns the episode's show.
func (a *API) ownEpisode(r *http.Request) (viewer, episodeID int64, err error) {
	if viewer, err = a.requireViewer(r); err != nil {
		return
	}
	if episodeID, err = pathID(r, "id"); err != nil {
		return
	}
	var owner int64
	if err = a.DB.QueryRow(r.Context(), `SELECT s.owner_id FROM episodes e JOIN shows s ON s.id = e.show_id
		WHERE e.id = $1`, episodeID).Scan(&owner); err != nil {
		return
	}
	if owner != viewer {
		err = errForbidden
	}
	return
}

func (a *API) updateEpisode(w http.ResponseWriter, r *http.Request) error {
	viewer, id, err := a.ownEpisode(r)
	if err != nil {
		return err
	}
	var in episodeInput
	if err := readJSON(r, &in); err != nil {
		return err
	}
	if err := in.validate(); err != nil {
		return err
	}
	ctx := r.Context()
	tx, err := a.DB.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx) //nolint:errcheck
	if _, err := tx.Exec(ctx, `UPDATE episodes SET title = coalesce($2, title),
		description = coalesce($3, description), tags = coalesce($4, tags) WHERE id = $1`,
		id, in.Title, in.Description, in.Tags); err != nil {
		return err
	}
	var oldOriginal *string
	if in.UploadKey != nil {
		// New audio: process it again. Comments keep their times.
		if err := a.checkUpload(r, viewer, *in.UploadKey); err != nil {
			return err
		}
		if err := tx.QueryRow(ctx, `UPDATE episodes e SET original_key = $2, status = 'processing',
			transcript_status = 'pending', error = NULL FROM episodes o WHERE e.id = $1 AND o.id = e.id
			RETURNING o.original_key`, id, *in.UploadKey).Scan(&oldOriginal); err != nil {
			return err
		}
		if err := jobs.Add(ctx, tx, jobs.ProcessEpisode, jobs.EpisodePayload{EpisodeID: id}); err != nil {
			return err
		}
	}
	if err := tx.Commit(ctx); err != nil {
		return err
	}
	a.deleteLater(oldOriginal)
	return a.writeEpisode(w, r, viewer, id, http.StatusOK)
}

func (a *API) deleteEpisode(w http.ResponseWriter, r *http.Request) error {
	_, id, err := a.ownEpisode(r)
	if err != nil {
		return err
	}
	var original, listening *string
	if err := a.DB.QueryRow(r.Context(), `DELETE FROM episodes WHERE id = $1 RETURNING original_key, audio_key`, id).
		Scan(&original, &listening); err != nil {
		return err
	}
	a.deleteLater(original, listening)
	return noContent(w)
}

type Segment struct {
	Start float32 `json:"start"`
	End   float32 `json:"end"`
	Text  string  `json:"text"`
}

func (a *API) transcript(w http.ResponseWriter, r *http.Request) error {
	id, err := pathID(r, "id")
	if err != nil {
		return err
	}
	var status string
	if err := a.DB.QueryRow(r.Context(), `SELECT transcript_status FROM episodes WHERE id = $1 AND status = 'ready'`, id).
		Scan(&status); err != nil {
		return err
	}
	rows, err := a.DB.Query(r.Context(), `SELECT start_seconds, end_seconds, body FROM transcript_segments
		WHERE episode_id = $1 ORDER BY start_seconds`, id)
	if err != nil {
		return err
	}
	defer rows.Close()
	segments := []Segment{}
	for rows.Next() {
		var s Segment
		if err := rows.Scan(&s.Start, &s.End, &s.Text); err != nil {
			return err
		}
		segments = append(segments, s)
	}
	if err := rows.Err(); err != nil {
		return err
	}
	return writeJSON(w, http.StatusOK, map[string]any{"status": status, "segments": segments})
}

// toggle runs a statement on (viewer, episode) and answers 204.
func (a *API) toggle(w http.ResponseWriter, r *http.Request, query string) (viewer, episodeID int64, added bool, err error) {
	if viewer, err = a.requireViewer(r); err != nil {
		return
	}
	if episodeID, err = pathID(r, "id"); err != nil {
		return
	}
	tag, err := a.DB.Exec(r.Context(), query, viewer, episodeID)
	if err != nil {
		return
	}
	added = tag.RowsAffected() == 1
	err = noContent(w)
	return
}

func (a *API) episodeOwner(r *http.Request, episodeID int64) (owner, showID int64) {
	_ = a.DB.QueryRow(r.Context(), `SELECT s.owner_id, s.id FROM episodes e JOIN shows s ON s.id = e.show_id
		WHERE e.id = $1`, episodeID).Scan(&owner, &showID)
	return
}

func (a *API) like(w http.ResponseWriter, r *http.Request) error {
	viewer, id, added, err := a.toggle(w, r, `INSERT INTO likes (user_id, episode_id)
		SELECT $1, id FROM episodes WHERE id = $2 AND status = 'ready' ON CONFLICT DO NOTHING`)
	if err == nil && added {
		owner, showID := a.episodeOwner(r, id)
		a.notify(r.Context(), owner, "like", viewer, map[string]int64{"episode": id, "show": showID})
	}
	return err
}

func (a *API) unlike(w http.ResponseWriter, r *http.Request) error {
	_, _, _, err := a.toggle(w, r, `DELETE FROM likes WHERE user_id = $1 AND episode_id = $2`)
	return err
}

func (a *API) bookmark(w http.ResponseWriter, r *http.Request) error {
	_, _, _, err := a.toggle(w, r, `INSERT INTO bookmarks (user_id, episode_id)
		SELECT $1, id FROM episodes WHERE id = $2 AND status = 'ready' ON CONFLICT DO NOTHING`)
	return err
}

func (a *API) unbookmark(w http.ResponseWriter, r *http.Request) error {
	_, _, _, err := a.toggle(w, r, `DELETE FROM bookmarks WHERE user_id = $1 AND episode_id = $2`)
	return err
}

func (a *API) saveProgress(w http.ResponseWriter, r *http.Request) error {
	viewer, err := a.requireViewer(r)
	if err != nil {
		return err
	}
	id, err := pathID(r, "id")
	if err != nil {
		return err
	}
	var body struct {
		PositionSeconds float32 `json:"positionSeconds"`
		Completed       bool    `json:"completed"`
	}
	if err := readJSON(r, &body); err != nil {
		return err
	}
	if body.PositionSeconds < 0 {
		body.PositionSeconds = 0
	}
	if _, err := a.DB.Exec(r.Context(), `INSERT INTO listens (user_id, episode_id, position_seconds, completed)
		SELECT $1, id, $3, $4 FROM episodes WHERE id = $2 AND status = 'ready'
		ON CONFLICT (user_id, episode_id) DO UPDATE SET position_seconds = $3,
			completed = listens.completed OR $4, updated_at = now()`,
		viewer, id, body.PositionSeconds, body.Completed); err != nil {
		return err
	}
	return noContent(w)
}

// countPlay is called once when a listener starts an episode.
func (a *API) countPlay(w http.ResponseWriter, r *http.Request) error {
	id, err := pathID(r, "id")
	if err != nil {
		return err
	}
	if _, err := a.DB.Exec(r.Context(), `UPDATE episodes SET play_count = play_count + 1
		WHERE id = $1 AND status = 'ready'`, id); err != nil {
		return err
	}
	return noContent(w)
}
