package api

import (
	"net/http"
	"strings"
	"time"
)

type ProfileView struct {
	UserView
	Bio            string        `json:"bio"`
	FollowerCount  int           `json:"followerCount"`
	FollowingCount int           `json:"followingCount"`
	Following      bool          `json:"following"`
	IsMe           bool          `json:"isMe"`
	Shows          []ShowView    `json:"shows"`
	Comments       []CommentView `json:"comments"`
}

func (a *API) getUser(w http.ResponseWriter, r *http.Request) error {
	viewer := a.viewer(r)
	var p ProfileView
	var avatarKey *string
	err := a.DB.QueryRow(r.Context(), `SELECT id, handle, display_name, avatar_key, bio,
		(SELECT count(*) FROM user_follows WHERE followee_id = u.id),
		(SELECT count(*) FROM user_follows WHERE follower_id = u.id),
		EXISTS (SELECT 1 FROM user_follows WHERE followee_id = u.id AND follower_id = $2)
		FROM users u WHERE handle = $1`, strings.ToLower(r.PathValue("handle")), viewer).
		Scan(&p.ID, &p.Handle, &p.DisplayName, &avatarKey, &p.Bio, &p.FollowerCount, &p.FollowingCount, &p.Following)
	if err != nil {
		return err
	}
	p.AvatarURL = mediaURL(avatarKey)
	p.IsMe = viewer == p.ID
	if p.Shows, err = a.shows(r.Context(), viewer, `WHERE s.owner_id = $2 ORDER BY s.created_at DESC`, p.ID); err != nil {
		return err
	}
	if p.Comments, err = a.comments(r, viewer, `WHERE c.user_id = $1 AND e.status = 'ready'
		ORDER BY c.created_at DESC LIMIT 20`, p.ID); err != nil {
		return err
	}
	return writeJSON(w, http.StatusOK, p)
}

func (a *API) followUser(w http.ResponseWriter, r *http.Request) error {
	viewer, err := a.requireViewer(r)
	if err != nil {
		return err
	}
	id, err := pathID(r, "id")
	if err != nil {
		return err
	}
	if id == viewer {
		return fail(http.StatusBadRequest, "Vous ne pouvez pas vous suivre vous-même.")
	}
	tag, err := a.DB.Exec(r.Context(), `INSERT INTO user_follows (follower_id, followee_id)
		SELECT $1, id FROM users WHERE id = $2 ON CONFLICT DO NOTHING`, viewer, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 1 {
		a.notify(r.Context(), id, "follow_user", viewer, nil)
	}
	return noContent(w)
}

func (a *API) unfollowUser(w http.ResponseWriter, r *http.Request) error {
	viewer, err := a.requireViewer(r)
	if err != nil {
		return err
	}
	id, err := pathID(r, "id")
	if err != nil {
		return err
	}
	if _, err := a.DB.Exec(r.Context(), `DELETE FROM user_follows WHERE follower_id = $1 AND followee_id = $2`,
		viewer, id); err != nil {
		return err
	}
	return noContent(w)
}

// feed lists the newest episodes of followed shows and followed people,
// plus the episodes to resume.
func (a *API) feed(w http.ResponseWriter, r *http.Request) error {
	viewer, err := a.requireViewer(r)
	if err != nil {
		return err
	}
	episodes, err := a.episodes(r.Context(), viewer, `WHERE e.status = 'ready' AND (
			s.id IN (SELECT show_id FROM show_follows WHERE user_id = $1) OR
			s.owner_id IN (SELECT followee_id FROM user_follows WHERE follower_id = $1))
		ORDER BY e.published_at DESC LIMIT 50`)
	if err != nil {
		return err
	}
	resume, err := a.episodes(r.Context(), viewer, `JOIN listens h ON h.episode_id = e.id AND h.user_id = $1
		WHERE e.status = 'ready' AND NOT h.completed AND h.position_seconds > 5
		ORDER BY h.updated_at DESC LIMIT 6`)
	if err != nil {
		return err
	}
	return writeJSON(w, http.StatusOK, map[string]any{"episodes": episodes, "resume": resume})
}

// discover lists what is new and what people like these days.
func (a *API) discover(w http.ResponseWriter, r *http.Request) error {
	viewer := a.viewer(r)
	ctx := r.Context()
	recent, err := a.episodes(ctx, viewer, `WHERE e.status = 'ready' ORDER BY e.published_at DESC LIMIT 12`)
	if err != nil {
		return err
	}
	popular, err := a.episodes(ctx, viewer, `WHERE e.status = 'ready' AND e.published_at > now() - interval '90 days'
		ORDER BY e.play_count + 3 * (SELECT count(*) FROM likes l WHERE l.episode_id = e.id)
			+ 2 * (SELECT count(*) FROM comments c WHERE c.episode_id = e.id) DESC, e.published_at DESC
		LIMIT 12`)
	if err != nil {
		return err
	}
	shows, err := a.shows(ctx, viewer, `WHERE EXISTS (SELECT 1 FROM episodes e WHERE e.show_id = s.id AND e.status = 'ready')
		ORDER BY (SELECT count(*) FROM show_follows f WHERE f.show_id = s.id) DESC, s.created_at DESC LIMIT 12`)
	if err != nil {
		return err
	}
	rows, err := a.DB.Query(ctx, `SELECT tag, count(*) FROM episodes e, unnest(e.tags) tag
		WHERE e.status = 'ready' GROUP BY tag ORDER BY count(*) DESC, tag LIMIT 20`)
	if err != nil {
		return err
	}
	defer rows.Close()
	tags := []string{}
	for rows.Next() {
		var tag string
		var n int
		if err := rows.Scan(&tag, &n); err != nil {
			return err
		}
		tags = append(tags, tag)
	}
	if err := rows.Err(); err != nil {
		return err
	}
	return writeJSON(w, http.StatusOK, map[string]any{"recent": recent, "popular": popular, "shows": shows, "tags": tags})
}

type NotificationView struct {
	ID    int64     `json:"id"`
	Kind  string    `json:"kind"`
	Actor *UserView `json:"actor"`
	Show  *struct {
		Slug  string `json:"slug"`
		Title string `json:"title"`
	} `json:"show"`
	Episode *struct {
		ID    int64  `json:"id"`
		Title string `json:"title"`
	} `json:"episode"`
	Comment *struct {
		ID        int64    `json:"id"`
		Body      string   `json:"body"`
		AtSeconds *float32 `json:"atSeconds"`
		HasAudio  bool     `json:"hasAudio"`
	} `json:"comment"`
	CreatedAt time.Time `json:"createdAt"`
	Read      bool      `json:"read"`
}

func (a *API) notifications(w http.ResponseWriter, r *http.Request) error {
	viewer, err := a.requireViewer(r)
	if err != nil {
		return err
	}
	rows, err := a.DB.Query(r.Context(), `SELECT n.id, n.kind, n.created_at, n.read_at IS NOT NULL,
			u.id, u.handle, u.display_name, u.avatar_key, s.slug, s.title, e.id, e.title,
			c.id, c.body, c.at_seconds, c.audio_key IS NOT NULL
		FROM notifications n
			LEFT JOIN users u ON u.id = n.actor_id
			LEFT JOIN shows s ON s.id = n.show_id
			LEFT JOIN episodes e ON e.id = n.episode_id
			LEFT JOIN comments c ON c.id = n.comment_id
		WHERE n.user_id = $1 ORDER BY n.created_at DESC LIMIT 100`, viewer)
	if err != nil {
		return err
	}
	defer rows.Close()
	list := []NotificationView{}
	for rows.Next() {
		var n NotificationView
		var actorID, episodeID, commentID *int64
		var handle, name, avatarKey, slug, showTitle, episodeTitle, body *string
		var at *float32
		var hasAudio *bool
		if err := rows.Scan(&n.ID, &n.Kind, &n.CreatedAt, &n.Read, &actorID, &handle, &name, &avatarKey,
			&slug, &showTitle, &episodeID, &episodeTitle, &commentID, &body, &at, &hasAudio); err != nil {
			return err
		}
		if actorID != nil {
			n.Actor = &UserView{ID: *actorID, Handle: *handle, DisplayName: *name, AvatarURL: mediaURL(avatarKey)}
		}
		if slug != nil {
			n.Show = &struct {
				Slug  string `json:"slug"`
				Title string `json:"title"`
			}{*slug, *showTitle}
		}
		if episodeID != nil {
			n.Episode = &struct {
				ID    int64  `json:"id"`
				Title string `json:"title"`
			}{*episodeID, *episodeTitle}
		}
		if commentID != nil {
			n.Comment = &struct {
				ID        int64    `json:"id"`
				Body      string   `json:"body"`
				AtSeconds *float32 `json:"atSeconds"`
				HasAudio  bool     `json:"hasAudio"`
			}{*commentID, *body, at, *hasAudio}
		}
		list = append(list, n)
	}
	if err := rows.Err(); err != nil {
		return err
	}
	return writeJSON(w, http.StatusOK, list)
}

func (a *API) readNotifications(w http.ResponseWriter, r *http.Request) error {
	viewer, err := a.requireViewer(r)
	if err != nil {
		return err
	}
	if _, err := a.DB.Exec(r.Context(), `UPDATE notifications SET read_at = now()
		WHERE user_id = $1 AND read_at IS NULL`, viewer); err != nil {
		return err
	}
	return noContent(w)
}

var reportTargets = map[string]string{
	"episode": "episodes", "comment": "comments", "show": "shows", "user": "users",
}

func (a *API) report(w http.ResponseWriter, r *http.Request) error {
	viewer, err := a.requireViewer(r)
	if err != nil {
		return err
	}
	var body struct {
		TargetType string `json:"targetType"`
		TargetID   int64  `json:"targetId"`
		Reason     string `json:"reason"`
	}
	if err := readJSON(r, &body); err != nil {
		return err
	}
	table, ok := reportTargets[body.TargetType]
	reason := strings.TrimSpace(body.Reason)
	if !ok || reason == "" || len([]rune(reason)) > 1000 {
		return fail(http.StatusBadRequest, "Signalement invalide.")
	}
	var exists bool
	// table comes from the fixed list above, never from the request.
	if err := a.DB.QueryRow(r.Context(), `SELECT EXISTS (SELECT 1 FROM `+table+` WHERE id = $1)`, body.TargetID).
		Scan(&exists); err != nil {
		return err
	}
	if !exists {
		return errNotFound
	}
	if _, err := a.DB.Exec(r.Context(), `INSERT INTO reports (reporter_id, target_type, target_id, reason)
		VALUES ($1, $2, $3, $4)`, viewer, body.TargetType, body.TargetID, reason); err != nil {
		return err
	}
	return noContent(w)
}
