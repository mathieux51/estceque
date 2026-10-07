package api

import (
	"context"
	"time"
)

type UserView struct {
	ID          int64   `json:"id"`
	Handle      string  `json:"handle"`
	DisplayName string  `json:"displayName"`
	AvatarURL   *string `json:"avatarUrl"`
}

type ShowSummary struct {
	ID       int64    `json:"id"`
	Slug     string   `json:"slug"`
	Title    string   `json:"title"`
	CoverURL *string  `json:"coverUrl"`
	Owner    UserView `json:"owner"`
}

type EpisodeView struct {
	ID               int64       `json:"id"`
	Title            string      `json:"title"`
	Description      string      `json:"description"`
	Tags             []string    `json:"tags"`
	Status           string      `json:"status"`
	TranscriptStatus string      `json:"transcriptStatus"`
	AudioURL         *string     `json:"audioUrl"`
	DurationSeconds  *float32    `json:"durationSeconds"`
	PlayCount        int         `json:"playCount"`
	LikeCount        int         `json:"likeCount"`
	CommentCount     int         `json:"commentCount"`
	Liked            bool        `json:"liked"`
	Bookmarked       bool        `json:"bookmarked"`
	ProgressSeconds  *float32    `json:"progressSeconds"`
	PublishedAt      *time.Time  `json:"publishedAt"`
	CreatedAt        time.Time   `json:"createdAt"`
	CanEdit          bool        `json:"canEdit"`
	Show             ShowSummary `json:"show"`
	Waveform         []float32   `json:"waveform,omitempty"`
}

// episodeSelect lists episodes with the viewer's own state ($1, 0 for none).
const episodeSelect = `
	SELECT e.id, e.title, e.description, e.tags, e.status, e.transcript_status, e.audio_key,
		e.duration_seconds, e.play_count, e.published_at, e.created_at,
		(SELECT count(*) FROM likes l WHERE l.episode_id = e.id),
		(SELECT count(*) FROM comments c WHERE c.episode_id = e.id),
		EXISTS (SELECT 1 FROM likes l WHERE l.episode_id = e.id AND l.user_id = $1),
		EXISTS (SELECT 1 FROM bookmarks b WHERE b.episode_id = e.id AND b.user_id = $1),
		(SELECT li.position_seconds FROM listens li WHERE li.episode_id = e.id AND li.user_id = $1),
		s.id, s.slug, s.title, s.cover_key, u.id, u.handle, u.display_name, u.avatar_key
	FROM episodes e JOIN shows s ON s.id = e.show_id JOIN users u ON u.id = s.owner_id`

func (a *API) episodes(ctx context.Context, viewer int64, rest string, args ...any) ([]EpisodeView, error) {
	rows, err := a.DB.Query(ctx, episodeSelect+" "+rest, append([]any{viewer}, args...)...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	list := []EpisodeView{}
	for rows.Next() {
		var e EpisodeView
		var audioKey, coverKey, avatarKey *string
		if err := rows.Scan(&e.ID, &e.Title, &e.Description, &e.Tags, &e.Status, &e.TranscriptStatus, &audioKey,
			&e.DurationSeconds, &e.PlayCount, &e.PublishedAt, &e.CreatedAt, &e.LikeCount, &e.CommentCount,
			&e.Liked, &e.Bookmarked, &e.ProgressSeconds,
			&e.Show.ID, &e.Show.Slug, &e.Show.Title, &coverKey,
			&e.Show.Owner.ID, &e.Show.Owner.Handle, &e.Show.Owner.DisplayName, &avatarKey); err != nil {
			return nil, err
		}
		e.AudioURL, e.Show.CoverURL, e.Show.Owner.AvatarURL = mediaURL(audioKey), mediaURL(coverKey), mediaURL(avatarKey)
		e.CanEdit = viewer != 0 && e.Show.Owner.ID == viewer
		list = append(list, e)
	}
	return list, rows.Err()
}

type ShowView struct {
	ID            int64     `json:"id"`
	Slug          string    `json:"slug"`
	Title         string    `json:"title"`
	Description   string    `json:"description"`
	Tags          []string  `json:"tags"`
	CoverURL      *string   `json:"coverUrl"`
	Owner         UserView  `json:"owner"`
	EpisodeCount  int       `json:"episodeCount"`
	FollowerCount int       `json:"followerCount"`
	Following     bool      `json:"following"`
	CanEdit       bool      `json:"canEdit"`
	CreatedAt     time.Time `json:"createdAt"`
}

const showSelect = `
	SELECT s.id, s.slug, s.title, s.description, s.tags, s.cover_key, s.created_at,
		(SELECT count(*) FROM episodes e WHERE e.show_id = s.id AND e.status = 'ready'),
		(SELECT count(*) FROM show_follows f WHERE f.show_id = s.id),
		EXISTS (SELECT 1 FROM show_follows f WHERE f.show_id = s.id AND f.user_id = $1),
		u.id, u.handle, u.display_name, u.avatar_key
	FROM shows s JOIN users u ON u.id = s.owner_id`

func (a *API) shows(ctx context.Context, viewer int64, rest string, args ...any) ([]ShowView, error) {
	rows, err := a.DB.Query(ctx, showSelect+" "+rest, append([]any{viewer}, args...)...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	list := []ShowView{}
	for rows.Next() {
		var s ShowView
		var coverKey, avatarKey *string
		if err := rows.Scan(&s.ID, &s.Slug, &s.Title, &s.Description, &s.Tags, &coverKey, &s.CreatedAt,
			&s.EpisodeCount, &s.FollowerCount, &s.Following,
			&s.Owner.ID, &s.Owner.Handle, &s.Owner.DisplayName, &avatarKey); err != nil {
			return nil, err
		}
		s.CoverURL, s.Owner.AvatarURL = mediaURL(coverKey), mediaURL(avatarKey)
		s.CanEdit = viewer != 0 && s.Owner.ID == viewer
		list = append(list, s)
	}
	return list, rows.Err()
}

func (a *API) user(ctx context.Context, id int64) (UserView, error) {
	var u UserView
	var avatarKey *string
	err := a.DB.QueryRow(ctx, `SELECT id, handle, display_name, avatar_key FROM users WHERE id = $1`, id).
		Scan(&u.ID, &u.Handle, &u.DisplayName, &avatarKey)
	u.AvatarURL = mediaURL(avatarKey)
	return u, err
}
