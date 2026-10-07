package api

import (
	"io"
	"net/http"
	"os"
	"strings"

	"github.com/mathieux51/estceque/services/social/internal/audio"
	"github.com/mathieux51/estceque/services/social/internal/fingerprint"
)

// Moment is a place in an episode where the searched words are spoken.
type Moment struct {
	Episode EpisodeView `json:"episode"`
	Start   float32     `json:"start"`
	// Text with the matching words between ⟦ and ⟧.
	Snippet string `json:"snippet"`
}

// search finds shows, episodes, spoken moments and people. With `tag`, it
// lists the episodes with that tag.
func (a *API) search(w http.ResponseWriter, r *http.Request) error {
	viewer := a.viewer(r)
	ctx := r.Context()
	if tag := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("tag"))); tag != "" {
		episodes, err := a.episodes(ctx, viewer, `WHERE e.status = 'ready' AND $2 = ANY (e.tags)
			ORDER BY e.published_at DESC LIMIT 50`, tag)
		if err != nil {
			return err
		}
		return writeJSON(w, http.StatusOK, map[string]any{
			"shows": []ShowView{}, "episodes": episodes, "moments": []Moment{}, "users": []UserView{},
		})
	}
	q := strings.TrimSpace(r.URL.Query().Get("q"))
	if q == "" || len(q) > 200 {
		return fail(http.StatusBadRequest, "Tapez ce que vous cherchez.")
	}
	const query = `websearch_to_tsquery('fr', $2)`
	shows, err := a.shows(ctx, viewer, `WHERE s.search @@ `+query+`
		ORDER BY ts_rank(s.search, `+query+`) DESC LIMIT 10`, q)
	if err != nil {
		return err
	}
	episodes, err := a.episodes(ctx, viewer, `WHERE e.status = 'ready' AND e.search @@ `+query+`
		ORDER BY ts_rank(e.search, `+query+`) DESC, e.published_at DESC LIMIT 20`, q)
	if err != nil {
		return err
	}
	moments, err := a.moments(r, viewer, q)
	if err != nil {
		return err
	}
	rows, err := a.DB.Query(ctx, `SELECT id, handle, display_name, avatar_key FROM users
		WHERE search @@ websearch_to_tsquery('simple_unaccent', $1) OR handle ILIKE $2
		ORDER BY handle LIMIT 10`, q, strings.ReplaceAll(strings.ToLower(q), "%", "")+"%")
	if err != nil {
		return err
	}
	defer rows.Close()
	users := []UserView{}
	for rows.Next() {
		var u UserView
		var avatarKey *string
		if err := rows.Scan(&u.ID, &u.Handle, &u.DisplayName, &avatarKey); err != nil {
			return err
		}
		u.AvatarURL = mediaURL(avatarKey)
		users = append(users, u)
	}
	if err := rows.Err(); err != nil {
		return err
	}
	return writeJSON(w, http.StatusOK, map[string]any{
		"shows": shows, "episodes": episodes, "moments": moments, "users": users,
	})
}

// moments searches the transcripts, at most 3 moments per episode.
func (a *API) moments(r *http.Request, viewer int64, q string) ([]Moment, error) {
	rows, err := a.DB.Query(r.Context(), `
		WITH q AS (SELECT websearch_to_tsquery('fr', $1) AS query),
		hits AS (
			SELECT t.episode_id, t.start_seconds, t.body, ts_rank(t.search, q.query) AS rank,
				row_number() OVER (PARTITION BY t.episode_id ORDER BY ts_rank(t.search, q.query) DESC, t.start_seconds) AS n
			FROM transcript_segments t JOIN episodes e ON e.id = t.episode_id CROSS JOIN q
			WHERE e.status = 'ready' AND t.search @@ q.query)
		SELECT h.episode_id, h.start_seconds,
			ts_headline('fr', h.body, (SELECT query FROM q), 'StartSel=⟦, StopSel=⟧, HighlightAll=true')
		FROM hits h WHERE h.n <= 3 ORDER BY h.rank DESC, h.episode_id, h.start_seconds LIMIT 30`, q)
	if err != nil {
		return nil, err
	}
	type hit struct {
		episodeID int64
		start     float32
		snippet   string
	}
	var hits []hit
	ids := []int64{}
	seen := map[int64]bool{}
	for rows.Next() {
		var h hit
		if err := rows.Scan(&h.episodeID, &h.start, &h.snippet); err != nil {
			rows.Close()
			return nil, err
		}
		hits = append(hits, h)
		if !seen[h.episodeID] {
			seen[h.episodeID] = true
			ids = append(ids, h.episodeID)
		}
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return nil, err
	}
	moments := []Moment{}
	if len(ids) == 0 {
		return moments, nil
	}
	episodes, err := a.episodes(r.Context(), viewer, `WHERE e.id = ANY ($2)`, ids)
	if err != nil {
		return nil, err
	}
	byID := map[int64]EpisodeView{}
	for _, e := range episodes {
		byID[e.ID] = e
	}
	for _, h := range hits {
		if e, ok := byID[h.episodeID]; ok {
			moments = append(moments, Moment{Episode: e, Start: h.start, Snippet: h.snippet})
		}
	}
	return moments, nil
}

const (
	minMatchScore = 8
	maxSnippet    = 30 << 20
)

// searchAudio recognises an episode from a recording made near a speaker
// (multipart "audio" field) and tells where in the episode it is.
func (a *API) searchAudio(w http.ResponseWriter, r *http.Request) error {
	r.Body = http.MaxBytesReader(nil, r.Body, maxSnippet)
	file, _, err := r.FormFile("audio")
	if err != nil {
		return fail(http.StatusBadRequest, "Enregistrement manquant ou trop long.")
	}
	defer file.Close()
	tmp, err := os.CreateTemp("", "snippet")
	if err != nil {
		return err
	}
	defer os.Remove(tmp.Name())
	if _, err := io.Copy(tmp, file); err != nil {
		tmp.Close()
		return fail(http.StatusBadRequest, "Enregistrement trop long.")
	}
	if err := tmp.Close(); err != nil {
		return err
	}
	samples, err := audio.DecodeMono(r.Context(), tmp.Name(), fingerprint.SampleRate)
	if err != nil {
		a.Log.Warn("decode snippet", "err", err)
		return fail(http.StatusBadRequest, "Enregistrement illisible.")
	}
	seconds := float64(len(samples)) / fingerprint.SampleRate
	if seconds < 3 {
		return fail(http.StatusBadRequest, "Enregistrez au moins 3 secondes.")
	}
	if seconds > 60 {
		samples = samples[:60*fingerprint.SampleRate]
		seconds = 60
	}
	points := fingerprint.Compute(samples)
	hashes := make([]int32, 0, len(points))
	seen := map[int32]bool{}
	for _, p := range points {
		if !seen[p.Hash] {
			seen[p.Hash] = true
			hashes = append(hashes, p.Hash)
		}
	}
	rows, err := a.DB.Query(r.Context(), `SELECT f.hash, f.episode_id, f.frame FROM fingerprints f
		JOIN episodes e ON e.id = f.episode_id WHERE f.hash = ANY ($1) AND e.status = 'ready'`, hashes)
	if err != nil {
		return err
	}
	var hits []fingerprint.Hit
	for rows.Next() {
		var h fingerprint.Hit
		if err := rows.Scan(&h.Hash, &h.EpisodeID, &h.Frame); err != nil {
			rows.Close()
			return err
		}
		hits = append(hits, h)
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return err
	}
	matches := fingerprint.Best(points, hits, 2)
	// A real match has many landmarks lining up, clearly more than the runner-up.
	if len(matches) == 0 || matches[0].Score < minMatchScore ||
		(len(matches) > 1 && matches[0].Score < 2*matches[1].Score) {
		score := 0
		if len(matches) > 0 {
			score = matches[0].Score
		}
		a.Log.Info("audio search: no match", "seconds", seconds, "landmarks", len(points), "hits", len(hits), "best", score)
		return writeJSON(w, http.StatusOK, map[string]any{"match": nil})
	}
	best := matches[0]
	list, err := a.episodes(r.Context(), a.viewer(r), `WHERE e.id = $2`, best.EpisodeID)
	if err != nil {
		return err
	}
	if len(list) == 0 {
		return writeJSON(w, http.StatusOK, map[string]any{"match": nil})
	}
	start := max(fingerprint.FrameSeconds(best.OffsetFrame), 0)
	a.Log.Info("audio search: match", "episode", best.EpisodeID, "start", start, "score", best.Score)
	return writeJSON(w, http.StatusOK, map[string]any{"match": map[string]any{
		"episode": list[0],
		// Where the recording started, and where the episode is now.
		"startSeconds": start,
		"atSeconds":    start + seconds,
		"score":        best.Score,
	}})
}
