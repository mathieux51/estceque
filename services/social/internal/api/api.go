// Package api is the JSON HTTP API of Direct Social.
package api

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/mathieux51/estceque/services/social/internal/config"
	"github.com/mathieux51/estceque/services/social/internal/mail"
	"github.com/mathieux51/estceque/services/social/internal/storage"
)

const sessionCookie = "ds_session"

type API struct {
	DB    *pgxpool.Pool
	Store *storage.Storage
	Mail  mail.Mailer
	Cfg   config.Config
	Log   *slog.Logger
}

// Handler returns the router with every route.
func (a *API) Handler() http.Handler {
	mux := http.NewServeMux()
	route := func(pattern string, h func(http.ResponseWriter, *http.Request) error) {
		mux.Handle(pattern, a.wrap(h))
	}

	route("GET /api/health", func(w http.ResponseWriter, r *http.Request) error {
		return writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})
	route("GET /api/media/{key...}", a.media)

	route("POST /api/auth/request", a.requestLogin)
	route("POST /api/auth/verify", a.verifyLogin)
	route("POST /api/auth/logout", a.logout)
	route("GET /api/me", a.me)
	route("PATCH /api/me", a.updateMe)
	route("POST /api/me/avatar", a.uploadAvatar)
	route("GET /api/me/bookmarks", a.myBookmarks)
	route("GET /api/me/history", a.myHistory)
	route("GET /api/me/shows", a.myShows)

	route("POST /api/shows", a.createShow)
	route("GET /api/shows/{slug}", a.getShow)
	route("PATCH /api/shows/{id}", a.updateShow)
	route("DELETE /api/shows/{id}", a.deleteShow)
	route("POST /api/shows/{id}/cover", a.uploadCover)
	route("POST /api/shows/{id}/follow", a.followShow)
	route("DELETE /api/shows/{id}/follow", a.unfollowShow)
	route("GET /api/shows/{slug}/rss", a.showRSS)

	route("POST /api/uploads/episode", a.episodeUploadURL)
	route("POST /api/shows/{id}/episodes", a.createEpisode)
	route("GET /api/episodes/{id}", a.getEpisode)
	route("PATCH /api/episodes/{id}", a.updateEpisode)
	route("DELETE /api/episodes/{id}", a.deleteEpisode)
	route("GET /api/episodes/{id}/transcript", a.transcript)
	route("POST /api/episodes/{id}/like", a.like)
	route("DELETE /api/episodes/{id}/like", a.unlike)
	route("POST /api/episodes/{id}/bookmark", a.bookmark)
	route("DELETE /api/episodes/{id}/bookmark", a.unbookmark)
	route("PUT /api/episodes/{id}/progress", a.saveProgress)
	route("POST /api/episodes/{id}/play", a.countPlay)

	route("GET /api/episodes/{id}/comments", a.listComments)
	route("POST /api/episodes/{id}/comments", a.createComment)
	route("DELETE /api/comments/{id}", a.deleteComment)

	route("GET /api/users/{handle}", a.getUser)
	route("POST /api/users/{id}/follow", a.followUser)
	route("DELETE /api/users/{id}/follow", a.unfollowUser)
	route("GET /api/feed", a.feed)
	route("GET /api/discover", a.discover)
	route("GET /api/notifications", a.notifications)
	route("POST /api/notifications/read", a.readNotifications)
	route("POST /api/reports", a.report)

	route("GET /api/search", a.search)
	route("POST /api/search/audio", a.searchAudio)
	return mux
}

// httpError is an error with a status code and a message for the user.
type httpError struct {
	status  int
	message string
}

func (e httpError) Error() string { return e.message }

func fail(status int, message string) error { return httpError{status, message} }

var (
	errUnauthorized = fail(http.StatusUnauthorized, "Connectez-vous pour continuer.")
	errForbidden    = fail(http.StatusForbidden, "Vous n'avez pas le droit de faire cela.")
	errNotFound     = fail(http.StatusNotFound, "Introuvable.")
)

func (a *API) wrap(h func(http.ResponseWriter, *http.Request) error) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		err := h(w, r)
		if err == nil {
			return
		}
		var he httpError
		switch {
		case errors.As(err, &he):
			_ = writeJSON(w, he.status, map[string]string{"error": he.message})
		case errors.Is(err, pgx.ErrNoRows):
			_ = writeJSON(w, http.StatusNotFound, map[string]string{"error": errNotFound.Error()})
		default:
			a.Log.Error("request failed", "method", r.Method, "path", r.URL.Path, "err", err)
			_ = writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Une erreur est survenue."})
		}
	})
}

func writeJSON(w http.ResponseWriter, status int, v any) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	return json.NewEncoder(w).Encode(v)
}

func noContent(w http.ResponseWriter) error {
	w.WriteHeader(http.StatusNoContent)
	return nil
}

func readJSON(r *http.Request, v any) error {
	if err := json.NewDecoder(http.MaxBytesReader(nil, r.Body, 1<<20)).Decode(v); err != nil {
		return fail(http.StatusBadRequest, "Requête invalide.")
	}
	return nil
}

func pathID(r *http.Request, name string) (int64, error) {
	id, err := strconv.ParseInt(r.PathValue(name), 10, 64)
	if err != nil {
		return 0, errNotFound
	}
	return id, nil
}

func randomToken() (string, []byte) {
	raw := make([]byte, 32)
	_, _ = rand.Read(raw)
	token := base64.RawURLEncoding.EncodeToString(raw)
	return token, hashToken(token)
}

func hashToken(token string) []byte {
	sum := sha256.Sum256([]byte(token))
	return sum[:]
}

// viewer returns the signed-in user's id, or 0.
func (a *API) viewer(r *http.Request) int64 {
	cookie, err := r.Cookie(sessionCookie)
	if err != nil {
		return 0
	}
	var id int64
	err = a.DB.QueryRow(r.Context(), `SELECT user_id FROM sessions WHERE token_hash = $1 AND expires_at > now()`,
		hashToken(cookie.Value)).Scan(&id)
	if err != nil {
		return 0
	}
	return id
}

func (a *API) requireViewer(r *http.Request) (int64, error) {
	if id := a.viewer(r); id != 0 {
		return id, nil
	}
	return 0, errUnauthorized
}

// mediaURL is the stable address the web app uses for a stored file.
func mediaURL(key *string) *string {
	if key == nil || *key == "" {
		return nil
	}
	u := "/api/media/" + *key
	return &u
}

// media redirects to a short-lived signed URL of the stored file.
func (a *API) media(w http.ResponseWriter, r *http.Request) error {
	key := r.PathValue("key")
	if key == "" || strings.Contains(key, "..") {
		return errNotFound
	}
	u, err := a.Store.DownloadURL(r.Context(), key)
	if err != nil {
		return err
	}
	w.Header().Set("Cache-Control", "private, max-age=3600")
	http.Redirect(w, r, u, http.StatusFound)
	return nil
}

// notify records a notification, unless people act on their own things.
func (a *API) notify(ctx context.Context, userID int64, kind string, actorID int64, ids map[string]int64) {
	if userID == 0 || userID == actorID {
		return
	}
	_, err := a.DB.Exec(ctx, `INSERT INTO notifications (user_id, kind, actor_id, show_id, episode_id, comment_id)
		VALUES ($1, $2, $3, $4, $5, $6)`, userID, kind, actorID,
		nullID(ids["show"]), nullID(ids["episode"]), nullID(ids["comment"]))
	if err != nil {
		a.Log.Error("notify", "err", err)
	}
}

func nullID(id int64) *int64 {
	if id == 0 {
		return nil
	}
	return &id
}

func setSession(w http.ResponseWriter, token string, expires time.Time) {
	http.SetCookie(w, &http.Cookie{
		Name: sessionCookie, Value: token, Path: "/", Expires: expires,
		HttpOnly: true, SameSite: http.SameSiteLaxMode,
	})
}
