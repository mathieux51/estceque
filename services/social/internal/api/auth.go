package api

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"net/mail"
	"path"
	"regexp"
	"strings"
	"time"
	"unicode"

	"github.com/jackc/pgx/v5"
)

const (
	loginTTL   = 15 * time.Minute
	sessionTTL = 30 * 24 * time.Hour
)

var handlePattern = regexp.MustCompile(`^[a-z0-9_]{3,30}$`)

// requestLogin emails a sign-in link. It answers the same way for every
// address, so it does not reveal who has an account.
func (a *API) requestLogin(w http.ResponseWriter, r *http.Request) error {
	var body struct {
		Email string `json:"email"`
	}
	if err := readJSON(r, &body); err != nil {
		return err
	}
	email := strings.ToLower(strings.TrimSpace(body.Email))
	if addr, err := mail.ParseAddress(email); err != nil || addr.Address != email {
		return fail(http.StatusBadRequest, "Adresse e-mail invalide.")
	}
	var recent int
	if err := a.DB.QueryRow(r.Context(), `SELECT count(*) FROM login_tokens
		WHERE email = $1 AND expires_at > now() AND used_at IS NULL`, email).Scan(&recent); err != nil {
		return err
	}
	if recent >= 5 {
		return fail(http.StatusTooManyRequests, "Trop de demandes. Réessayez dans quelques minutes.")
	}
	token, hash := randomToken()
	if _, err := a.DB.Exec(r.Context(), `INSERT INTO login_tokens (token_hash, email, expires_at) VALUES ($1, $2, $3)`,
		hash, email, time.Now().Add(loginTTL)); err != nil {
		return err
	}
	link := a.Cfg.WebURL + "/connexion/lien?token=" + token
	text := fmt.Sprintf("Bonjour,\n\nPour vous connecter à Direct Social, ouvrez ce lien :\n\n%s\n\n"+
		"Il est valable 15 minutes. Si vous n'avez rien demandé, ignorez ce message.\n", link)
	if err := a.Mail.Send(email, "Votre lien de connexion à Direct Social", text); err != nil {
		return err
	}
	return noContent(w)
}

func (a *API) verifyLogin(w http.ResponseWriter, r *http.Request) error {
	var body struct {
		Token string `json:"token"`
	}
	if err := readJSON(r, &body); err != nil {
		return err
	}
	ctx := r.Context()
	var email string
	err := a.DB.QueryRow(ctx, `UPDATE login_tokens SET used_at = now()
		WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now() RETURNING email`,
		hashToken(body.Token)).Scan(&email)
	if err == pgx.ErrNoRows {
		return fail(http.StatusBadRequest, "Ce lien n'est plus valable. Demandez-en un nouveau.")
	}
	if err != nil {
		return err
	}
	var userID int64
	isNew := false
	err = a.DB.QueryRow(ctx, `SELECT id FROM users WHERE email = $1`, email).Scan(&userID)
	if err == pgx.ErrNoRows {
		isNew = true
		userID, err = a.createUser(ctx, email)
	}
	if err != nil {
		return err
	}
	token, hash := randomToken()
	expires := time.Now().Add(sessionTTL)
	if _, err := a.DB.Exec(ctx, `INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)`,
		hash, userID, expires); err != nil {
		return err
	}
	setSession(w, token, expires)
	return writeJSON(w, http.StatusOK, map[string]any{"isNew": isNew})
}

// createUser makes an account with a handle taken from the email address.
func (a *API) createUser(ctx context.Context, email string) (int64, error) {
	local := email[:strings.IndexByte(email, '@')]
	base := strings.Map(func(r rune) rune {
		switch {
		case r >= 'a' && r <= 'z', r >= '0' && r <= '9', r == '_':
			return r
		case r == '.' || r == '-' || r == '+':
			return '_'
		}
		return -1
	}, local)
	if len(base) > 24 {
		base = base[:24]
	}
	for len(base) < 3 {
		base += "_"
	}
	name := strings.NewReplacer(".", " ", "_", " ", "-", " ", "+", " ").Replace(local)
	if strings.TrimSpace(name) == "" {
		name = base
	}
	// "alice.martin" becomes "Alice Martin".
	words := strings.Fields(name)
	for i, word := range words {
		runes := []rune(word)
		runes[0] = unicode.ToUpper(runes[0])
		words[i] = string(runes)
	}
	name = strings.Join(words, " ")
	for i := 0; ; i++ {
		handle := base
		if i > 0 {
			handle = fmt.Sprintf("%s%d", base, i+1)
		}
		var id int64
		err := a.DB.QueryRow(ctx, `INSERT INTO users (email, handle, display_name) VALUES ($1, $2, $3)
			ON CONFLICT (handle) DO NOTHING RETURNING id`, email, handle, name).Scan(&id)
		if err != pgx.ErrNoRows {
			return id, err
		}
	}
}

func (a *API) logout(w http.ResponseWriter, r *http.Request) error {
	if cookie, err := r.Cookie(sessionCookie); err == nil {
		if _, err := a.DB.Exec(r.Context(), `DELETE FROM sessions WHERE token_hash = $1`, hashToken(cookie.Value)); err != nil {
			return err
		}
	}
	setSession(w, "", time.Unix(0, 0))
	return noContent(w)
}

type MeView struct {
	UserView
	Email               string `json:"email"`
	Bio                 string `json:"bio"`
	UnreadNotifications int    `json:"unreadNotifications"`
}

func (a *API) me(w http.ResponseWriter, r *http.Request) error {
	id := a.viewer(r)
	if id == 0 {
		return writeJSON(w, http.StatusOK, nil)
	}
	var me MeView
	var avatarKey *string
	err := a.DB.QueryRow(r.Context(), `SELECT id, handle, display_name, avatar_key, email, bio,
		(SELECT count(*) FROM notifications WHERE user_id = $1 AND read_at IS NULL)
		FROM users WHERE id = $1`, id).
		Scan(&me.ID, &me.Handle, &me.DisplayName, &avatarKey, &me.Email, &me.Bio, &me.UnreadNotifications)
	if err != nil {
		return err
	}
	me.AvatarURL = mediaURL(avatarKey)
	return writeJSON(w, http.StatusOK, me)
}

func (a *API) updateMe(w http.ResponseWriter, r *http.Request) error {
	id, err := a.requireViewer(r)
	if err != nil {
		return err
	}
	var body struct {
		Handle      *string `json:"handle"`
		DisplayName *string `json:"displayName"`
		Bio         *string `json:"bio"`
	}
	if err := readJSON(r, &body); err != nil {
		return err
	}
	if body.Handle != nil {
		h := strings.ToLower(strings.TrimSpace(*body.Handle))
		if !handlePattern.MatchString(h) {
			return fail(http.StatusBadRequest, "Le pseudo doit faire 3 à 30 caractères : lettres, chiffres ou _.")
		}
		var taken bool
		if err := a.DB.QueryRow(r.Context(), `SELECT EXISTS (SELECT 1 FROM users WHERE handle = $1 AND id <> $2)`,
			h, id).Scan(&taken); err != nil {
			return err
		}
		if taken {
			return fail(http.StatusConflict, "Ce pseudo est déjà pris.")
		}
		body.Handle = &h
	}
	if body.DisplayName != nil {
		name := strings.TrimSpace(*body.DisplayName)
		if name == "" || len([]rune(name)) > 60 {
			return fail(http.StatusBadRequest, "Le nom doit faire 1 à 60 caractères.")
		}
		body.DisplayName = &name
	}
	if body.Bio != nil && len([]rune(*body.Bio)) > 500 {
		return fail(http.StatusBadRequest, "La bio fait au plus 500 caractères.")
	}
	if _, err := a.DB.Exec(r.Context(), `UPDATE users SET handle = coalesce($2, handle),
		display_name = coalesce($3, display_name), bio = coalesce($4, bio) WHERE id = $1`,
		id, body.Handle, body.DisplayName, body.Bio); err != nil {
		return err
	}
	return a.me(w, r)
}

var imageTypes = map[string]string{"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}

// storeImage saves the "image" field of a multipart form (5 MB at most).
func (a *API) storeImage(r *http.Request, prefix string) (string, error) {
	r.Body = http.MaxBytesReader(nil, r.Body, 5<<20+1<<16)
	file, header, err := r.FormFile("image")
	if err != nil {
		return "", fail(http.StatusBadRequest, "Image manquante ou trop lourde (5 Mo au plus).")
	}
	defer file.Close()
	head := make([]byte, 512)
	n, _ := io.ReadFull(file, head)
	contentType := http.DetectContentType(head[:n])
	ext, ok := imageTypes[contentType]
	if !ok {
		return "", fail(http.StatusBadRequest, "Formats acceptés : JPEG, PNG, WebP.")
	}
	if _, err := file.Seek(0, io.SeekStart); err != nil {
		return "", err
	}
	key := path.Join(prefix, fmt.Sprintf("%d%s", time.Now().UnixNano(), ext))
	return key, a.Store.Put(r.Context(), key, file, header.Size, contentType)
}

func (a *API) uploadAvatar(w http.ResponseWriter, r *http.Request) error {
	id, err := a.requireViewer(r)
	if err != nil {
		return err
	}
	key, err := a.storeImage(r, fmt.Sprintf("avatars/%d", id))
	if err != nil {
		return err
	}
	var old *string
	if err := a.DB.QueryRow(r.Context(), `UPDATE users u SET avatar_key = $2 FROM users o
		WHERE u.id = $1 AND o.id = u.id RETURNING o.avatar_key`, id, key).Scan(&old); err != nil {
		return err
	}
	a.deleteLater(old)
	return a.me(w, r)
}

// deleteLater removes a replaced file without slowing the request.
func (a *API) deleteLater(keys ...*string) {
	for _, key := range keys {
		if key == nil || *key == "" {
			continue
		}
		go func(k string) {
			if err := a.Store.Delete(context.Background(), k); err != nil {
				a.Log.Warn("delete file", "key", k, "err", err)
			}
		}(*key)
	}
}

func (a *API) myBookmarks(w http.ResponseWriter, r *http.Request) error {
	id, err := a.requireViewer(r)
	if err != nil {
		return err
	}
	list, err := a.episodes(r.Context(), id, `JOIN bookmarks b ON b.episode_id = e.id AND b.user_id = $1
		WHERE e.status = 'ready' ORDER BY b.created_at DESC LIMIT 100`)
	if err != nil {
		return err
	}
	return writeJSON(w, http.StatusOK, list)
}

func (a *API) myHistory(w http.ResponseWriter, r *http.Request) error {
	id, err := a.requireViewer(r)
	if err != nil {
		return err
	}
	list, err := a.episodes(r.Context(), id, `JOIN listens h ON h.episode_id = e.id AND h.user_id = $1
		WHERE e.status = 'ready' ORDER BY h.updated_at DESC LIMIT 100`)
	if err != nil {
		return err
	}
	return writeJSON(w, http.StatusOK, list)
}

func (a *API) myShows(w http.ResponseWriter, r *http.Request) error {
	id, err := a.requireViewer(r)
	if err != nil {
		return err
	}
	list, err := a.shows(r.Context(), id, `WHERE s.owner_id = $1 ORDER BY s.created_at DESC`)
	if err != nil {
		return err
	}
	return writeJSON(w, http.StatusOK, list)
}
