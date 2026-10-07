package api

import (
	"encoding/xml"
	"fmt"
	"net/http"
	"strings"
	"time"
	"unicode"

	"golang.org/x/text/unicode/norm"
)

// slugify turns a title into a URL part: "Café du matin" -> "cafe-du-matin".
func slugify(title string) string {
	var b strings.Builder
	dash := false
	for _, r := range norm.NFD.String(strings.ToLower(title)) {
		switch {
		case unicode.Is(unicode.Mn, r):
			// Accent marks, removed.
		case r >= 'a' && r <= 'z', r >= '0' && r <= '9':
			b.WriteRune(r)
			dash = false
		case !dash && b.Len() > 0:
			b.WriteRune('-')
			dash = true
		}
	}
	slug := strings.TrimSuffix(b.String(), "-")
	if len(slug) > 60 {
		slug = strings.TrimSuffix(slug[:60], "-")
	}
	if slug == "" {
		slug = "podcast"
	}
	return slug
}

func cleanTags(tags []string) []string {
	out := []string{}
	seen := map[string]bool{}
	for _, t := range tags {
		t = strings.ToLower(strings.TrimSpace(strings.TrimPrefix(strings.TrimSpace(t), "#")))
		if t == "" || len([]rune(t)) > 30 || seen[t] {
			continue
		}
		seen[t] = true
		out = append(out, t)
		if len(out) == 10 {
			break
		}
	}
	return out
}

type showInput struct {
	Title       *string  `json:"title"`
	Description *string  `json:"description"`
	Tags        []string `json:"tags"`
}

func (in *showInput) validate() error {
	if in.Title != nil {
		t := strings.TrimSpace(*in.Title)
		if t == "" || len([]rune(t)) > 120 {
			return fail(http.StatusBadRequest, "Le titre doit faire 1 à 120 caractères.")
		}
		in.Title = &t
	}
	if in.Description != nil && len([]rune(*in.Description)) > 5000 {
		return fail(http.StatusBadRequest, "La description fait au plus 5000 caractères.")
	}
	if in.Tags != nil {
		in.Tags = cleanTags(in.Tags)
	}
	return nil
}

func (a *API) createShow(w http.ResponseWriter, r *http.Request) error {
	viewer, err := a.requireViewer(r)
	if err != nil {
		return err
	}
	var in showInput
	if err := readJSON(r, &in); err != nil {
		return err
	}
	if in.Title == nil {
		return fail(http.StatusBadRequest, "Le titre est obligatoire.")
	}
	if err := in.validate(); err != nil {
		return err
	}
	if in.Description == nil {
		in.Description = new(string)
	}
	if in.Tags == nil {
		in.Tags = []string{}
	}
	base := slugify(*in.Title)
	var slug string
	for i := 1; ; i++ {
		slug = base
		if i > 1 {
			slug = fmt.Sprintf("%s-%d", base, i)
		}
		tag, err := a.DB.Exec(r.Context(), `INSERT INTO shows (owner_id, slug, title, description, tags)
			VALUES ($1, $2, $3, $4, $5) ON CONFLICT (slug) DO NOTHING`, viewer, slug, *in.Title, *in.Description, in.Tags)
		if err != nil {
			return err
		}
		if tag.RowsAffected() == 1 {
			break
		}
	}
	return a.writeShow(w, r, viewer, slug, http.StatusCreated)
}

func (a *API) writeShow(w http.ResponseWriter, r *http.Request, viewer int64, slug string, status int) error {
	list, err := a.shows(r.Context(), viewer, `WHERE s.slug = $2`, slug)
	if err != nil {
		return err
	}
	if len(list) == 0 {
		return errNotFound
	}
	return writeJSON(w, status, list[0])
}

func (a *API) getShow(w http.ResponseWriter, r *http.Request) error {
	viewer := a.viewer(r)
	list, err := a.shows(r.Context(), viewer, `WHERE s.slug = $2`, r.PathValue("slug"))
	if err != nil {
		return err
	}
	if len(list) == 0 {
		return errNotFound
	}
	show := list[0]
	// Owners also see episodes still processing or failed.
	episodes, err := a.episodes(r.Context(), viewer, `WHERE e.show_id = $2 AND (e.status = 'ready' OR s.owner_id = $1)
		ORDER BY coalesce(e.published_at, e.created_at) DESC`, show.ID)
	if err != nil {
		return err
	}
	return writeJSON(w, http.StatusOK, map[string]any{"show": show, "episodes": episodes})
}

// ownShow checks that the viewer owns the show and returns its slug.
func (a *API) ownShow(r *http.Request) (viewer, showID int64, slug string, err error) {
	if viewer, err = a.requireViewer(r); err != nil {
		return
	}
	if showID, err = pathID(r, "id"); err != nil {
		return
	}
	var owner int64
	if err = a.DB.QueryRow(r.Context(), `SELECT owner_id, slug FROM shows WHERE id = $1`, showID).
		Scan(&owner, &slug); err != nil {
		return
	}
	if owner != viewer {
		err = errForbidden
	}
	return
}

func (a *API) updateShow(w http.ResponseWriter, r *http.Request) error {
	viewer, showID, slug, err := a.ownShow(r)
	if err != nil {
		return err
	}
	var in showInput
	if err := readJSON(r, &in); err != nil {
		return err
	}
	if err := in.validate(); err != nil {
		return err
	}
	if _, err := a.DB.Exec(r.Context(), `UPDATE shows SET title = coalesce($2, title),
		description = coalesce($3, description), tags = coalesce($4, tags) WHERE id = $1`,
		showID, in.Title, in.Description, in.Tags); err != nil {
		return err
	}
	return a.writeShow(w, r, viewer, slug, http.StatusOK)
}

func (a *API) deleteShow(w http.ResponseWriter, r *http.Request) error {
	_, showID, _, err := a.ownShow(r)
	if err != nil {
		return err
	}
	var keys []*string
	rows, err := a.DB.Query(r.Context(), `SELECT original_key FROM episodes WHERE show_id = $1
		UNION ALL SELECT audio_key FROM episodes WHERE show_id = $1
		UNION ALL SELECT cover_key FROM shows WHERE id = $1
		UNION ALL SELECT c.audio_key FROM comments c JOIN episodes e ON e.id = c.episode_id WHERE e.show_id = $1`, showID)
	if err != nil {
		return err
	}
	for rows.Next() {
		var k *string
		if err := rows.Scan(&k); err != nil {
			return err
		}
		keys = append(keys, k)
	}
	if err := rows.Err(); err != nil {
		return err
	}
	if _, err := a.DB.Exec(r.Context(), `DELETE FROM shows WHERE id = $1`, showID); err != nil {
		return err
	}
	a.deleteLater(keys...)
	return noContent(w)
}

func (a *API) uploadCover(w http.ResponseWriter, r *http.Request) error {
	viewer, showID, slug, err := a.ownShow(r)
	if err != nil {
		return err
	}
	key, err := a.storeImage(r, fmt.Sprintf("covers/%d", showID))
	if err != nil {
		return err
	}
	var old *string
	if err := a.DB.QueryRow(r.Context(), `UPDATE shows s SET cover_key = $2 FROM shows o
		WHERE s.id = $1 AND o.id = s.id RETURNING o.cover_key`, showID, key).Scan(&old); err != nil {
		return err
	}
	a.deleteLater(old)
	return a.writeShow(w, r, viewer, slug, http.StatusOK)
}

func (a *API) followShow(w http.ResponseWriter, r *http.Request) error {
	viewer, err := a.requireViewer(r)
	if err != nil {
		return err
	}
	showID, err := pathID(r, "id")
	if err != nil {
		return err
	}
	var owner int64
	if err := a.DB.QueryRow(r.Context(), `SELECT owner_id FROM shows WHERE id = $1`, showID).Scan(&owner); err != nil {
		return err
	}
	tag, err := a.DB.Exec(r.Context(), `INSERT INTO show_follows (user_id, show_id) VALUES ($1, $2)
		ON CONFLICT DO NOTHING`, viewer, showID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 1 {
		a.notify(r.Context(), owner, "follow_show", viewer, map[string]int64{"show": showID})
	}
	return noContent(w)
}

func (a *API) unfollowShow(w http.ResponseWriter, r *http.Request) error {
	viewer, err := a.requireViewer(r)
	if err != nil {
		return err
	}
	showID, err := pathID(r, "id")
	if err != nil {
		return err
	}
	if _, err := a.DB.Exec(r.Context(), `DELETE FROM show_follows WHERE user_id = $1 AND show_id = $2`,
		viewer, showID); err != nil {
		return err
	}
	return noContent(w)
}

// RSS 2.0 with the iTunes tags podcast apps expect.
type rssFeed struct {
	XMLName xml.Name   `xml:"rss"`
	Version string     `xml:"version,attr"`
	ITunes  string     `xml:"xmlns:itunes,attr"`
	Channel rssChannel `xml:"channel"`
}

type rssChannel struct {
	Title       string    `xml:"title"`
	Link        string    `xml:"link"`
	Description string    `xml:"description"`
	Language    string    `xml:"language"`
	Author      string    `xml:"itunes:author"`
	Image       *rssImage `xml:"itunes:image"`
	Items       []rssItem `xml:"item"`
}

type rssImage struct {
	Href string `xml:"href,attr"`
}

type rssItem struct {
	Title       string       `xml:"title"`
	Link        string       `xml:"link"`
	GUID        string       `xml:"guid"`
	Description string       `xml:"description"`
	PubDate     string       `xml:"pubDate"`
	Duration    int          `xml:"itunes:duration"`
	Enclosure   rssEnclosure `xml:"enclosure"`
}

type rssEnclosure struct {
	URL    string `xml:"url,attr"`
	Type   string `xml:"type,attr"`
	Length int64  `xml:"length,attr"`
}

func (a *API) showRSS(w http.ResponseWriter, r *http.Request) error {
	list, err := a.shows(r.Context(), 0, `WHERE s.slug = $2`, r.PathValue("slug"))
	if err != nil {
		return err
	}
	if len(list) == 0 {
		return errNotFound
	}
	show := list[0]
	episodes, err := a.episodes(r.Context(), 0, `WHERE e.show_id = $2 AND e.status = 'ready'
		ORDER BY e.published_at DESC LIMIT 300`, show.ID)
	if err != nil {
		return err
	}
	base := strings.TrimSuffix(a.Cfg.WebURL, "/")
	channel := rssChannel{
		Title: show.Title, Link: base + "/podcasts/" + show.Slug, Description: show.Description,
		Language: "fr", Author: show.Owner.DisplayName,
	}
	if show.CoverURL != nil {
		channel.Image = &rssImage{Href: base + *show.CoverURL}
	}
	for _, e := range episodes {
		item := rssItem{
			Title: e.Title, Link: fmt.Sprintf("%s/episodes/%d", base, e.ID),
			GUID: fmt.Sprintf("direct-social-episode-%d", e.ID), Description: e.Description,
			Enclosure: rssEnclosure{Type: "audio/mpeg"},
		}
		if e.PublishedAt != nil {
			item.PubDate = e.PublishedAt.UTC().Format(time.RFC1123Z)
		}
		if e.DurationSeconds != nil {
			item.Duration = int(*e.DurationSeconds)
		}
		if e.AudioURL != nil {
			item.Enclosure.URL = base + *e.AudioURL
			key := strings.TrimPrefix(*e.AudioURL, "/api/media/")
			if size, err := a.Store.Size(r.Context(), key); err == nil {
				item.Enclosure.Length = size
			}
		}
		channel.Items = append(channel.Items, item)
	}
	w.Header().Set("Content-Type", "application/rss+xml; charset=utf-8")
	if _, err := w.Write([]byte(xml.Header)); err != nil {
		return err
	}
	enc := xml.NewEncoder(w)
	enc.Indent("", "  ")
	return enc.Encode(rssFeed{Version: "2.0", ITunes: "http://www.itunes.com/dtds/podcast-1.0.dtd", Channel: channel})
}
