// Package worker processes uploaded episodes: listening copy, waveform,
// audio fingerprints and transcript.
package worker

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/mathieux51/estceque/services/social/internal/audio"
	"github.com/mathieux51/estceque/services/social/internal/config"
	"github.com/mathieux51/estceque/services/social/internal/fingerprint"
	"github.com/mathieux51/estceque/services/social/internal/jobs"
	"github.com/mathieux51/estceque/services/social/internal/storage"
	"github.com/mathieux51/estceque/services/social/internal/transcribe"
)

type Worker struct {
	DB    *pgxpool.Pool
	Store *storage.Storage
	Cfg   config.Config
	Log   *slog.Logger
}

// Run processes jobs until the context ends.
func (w *Worker) Run(ctx context.Context) error {
	if err := jobs.Recover(ctx, w.DB); err != nil {
		return err
	}
	for ctx.Err() == nil {
		job, err := jobs.Claim(ctx, w.DB)
		if err != nil {
			w.Log.Error("claim job", "err", err)
			sleep(ctx, 5*time.Second)
			continue
		}
		if job == nil {
			sleep(ctx, 2*time.Second)
			continue
		}
		started := time.Now()
		jobErr := w.handle(ctx, job)
		retrying, err := jobs.Finish(ctx, w.DB, job, jobErr)
		if err != nil {
			w.Log.Error("finish job", "id", job.ID, "err", err)
		}
		if jobErr != nil {
			w.Log.Error("job failed", "id", job.ID, "kind", job.Kind, "retrying", retrying, "err", jobErr)
			if !retrying {
				w.giveUp(ctx, job, jobErr)
			}
			continue
		}
		w.Log.Info("job done", "id", job.ID, "kind", job.Kind, "seconds", time.Since(started).Seconds())
	}
	return nil
}

func sleep(ctx context.Context, d time.Duration) {
	select {
	case <-ctx.Done():
	case <-time.After(d):
	}
}

func (w *Worker) handle(ctx context.Context, job *jobs.Job) error {
	var payload jobs.EpisodePayload
	if err := json.Unmarshal(job.Payload, &payload); err != nil {
		return err
	}
	switch job.Kind {
	case jobs.ProcessEpisode:
		return w.processEpisode(ctx, payload.EpisodeID)
	case jobs.TranscribeEpisode:
		return w.transcribeEpisode(ctx, payload.EpisodeID)
	}
	return fmt.Errorf("unknown job kind %q", job.Kind)
}

// giveUp marks the episode when its job failed for good.
func (w *Worker) giveUp(ctx context.Context, job *jobs.Job, jobErr error) {
	var payload jobs.EpisodePayload
	if json.Unmarshal(job.Payload, &payload) != nil {
		return
	}
	query := `UPDATE episodes SET status = 'failed', error = $2 WHERE id = $1`
	if job.Kind == jobs.TranscribeEpisode {
		query = `UPDATE episodes SET transcript_status = 'failed' WHERE id = $1 AND $2 <> ''`
	}
	if _, err := w.DB.Exec(ctx, query, payload.EpisodeID, jobErr.Error()); err != nil {
		w.Log.Error("mark failure", "err", err)
	}
}

func (w *Worker) download(ctx context.Context, episodeID int64, dir string) (string, error) {
	var key string
	if err := w.DB.QueryRow(ctx, `SELECT original_key FROM episodes WHERE id = $1`, episodeID).Scan(&key); err != nil {
		return "", err
	}
	path := filepath.Join(dir, "original"+filepath.Ext(key))
	return path, w.Store.GetFile(ctx, key, path)
}

func (w *Worker) processEpisode(ctx context.Context, episodeID int64) error {
	dir, err := os.MkdirTemp("", "episode")
	if err != nil {
		return err
	}
	defer os.RemoveAll(dir)
	original, err := w.download(ctx, episodeID, dir)
	if err != nil {
		return fmt.Errorf("download: %w", err)
	}

	listening := filepath.Join(dir, "listening.mp3")
	if err := audio.ListeningCopy(ctx, original, listening); err != nil {
		return err
	}
	duration, err := audio.Duration(ctx, listening)
	if err != nil {
		return err
	}
	samples, err := audio.DecodeMono(ctx, original, fingerprint.SampleRate)
	if err != nil {
		return err
	}
	waveform := audio.Waveform(samples, 1000)
	points := fingerprint.Compute(samples)

	audioKey := fmt.Sprintf("episodes/%d/listening-%d.mp3", episodeID, time.Now().Unix())
	if err := w.Store.PutFile(ctx, audioKey, listening, "audio/mpeg"); err != nil {
		return err
	}

	tx, err := w.DB.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx) //nolint:errcheck
	if _, err := tx.Exec(ctx, `DELETE FROM fingerprints WHERE episode_id = $1`, episodeID); err != nil {
		return err
	}
	rows := make([][]any, len(points))
	for i, p := range points {
		rows[i] = []any{p.Hash, episodeID, p.Frame}
	}
	if _, err := tx.CopyFrom(ctx, pgx.Identifier{"fingerprints"}, []string{"hash", "episode_id", "frame"},
		pgx.CopyFromRows(rows)); err != nil {
		return err
	}
	var firstPublish bool
	if err := tx.QueryRow(ctx, `SELECT published_at IS NULL FROM episodes WHERE id = $1 FOR UPDATE`,
		episodeID).Scan(&firstPublish); err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `
		UPDATE episodes SET status = 'ready', audio_key = $2, duration_seconds = $3, waveform = $4,
			error = NULL, published_at = coalesce(published_at, now())
		WHERE id = $1`, episodeID, audioKey, duration, waveform); err != nil {
		return err
	}
	if firstPublish {
		// Tell the show's followers about the new episode.
		if _, err := tx.Exec(ctx, `
			INSERT INTO notifications (user_id, kind, actor_id, show_id, episode_id)
			SELECT f.user_id, 'new_episode', s.owner_id, s.id, e.id
			FROM episodes e JOIN shows s ON s.id = e.show_id JOIN show_follows f ON f.show_id = s.id
			WHERE e.id = $1 AND f.user_id <> s.owner_id`, episodeID); err != nil {
			return err
		}
	}
	if err := jobs.Add(ctx, tx, jobs.TranscribeEpisode, jobs.EpisodePayload{EpisodeID: episodeID}); err != nil {
		return err
	}
	if err := tx.Commit(ctx); err != nil {
		return err
	}
	w.Log.Info("episode ready", "id", episodeID, "seconds", duration, "fingerprints", len(points))
	return nil
}

func (w *Worker) transcribeEpisode(ctx context.Context, episodeID int64) error {
	if _, err := w.DB.Exec(ctx, `UPDATE episodes SET transcript_status = 'running' WHERE id = $1`, episodeID); err != nil {
		return err
	}
	dir, err := os.MkdirTemp("", "transcript")
	if err != nil {
		return err
	}
	defer os.RemoveAll(dir)
	original, err := w.download(ctx, episodeID, dir)
	if err != nil {
		return err
	}
	wav := filepath.Join(dir, "speech.wav")
	if err := audio.WriteWav16k(ctx, original, wav); err != nil {
		return err
	}
	segments, err := transcribe.Run(ctx, w.Cfg.WhisperBin, w.Cfg.WhisperModel, wav)
	if err != nil {
		return err
	}
	tx, err := w.DB.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx) //nolint:errcheck
	if _, err := tx.Exec(ctx, `DELETE FROM transcript_segments WHERE episode_id = $1`, episodeID); err != nil {
		return err
	}
	rows := make([][]any, len(segments))
	for i, s := range segments {
		rows[i] = []any{episodeID, s.Start, s.End, s.Text}
	}
	if _, err := tx.CopyFrom(ctx, pgx.Identifier{"transcript_segments"},
		[]string{"episode_id", "start_seconds", "end_seconds", "body"}, pgx.CopyFromRows(rows)); err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `UPDATE episodes SET transcript_status = 'ready' WHERE id = $1`, episodeID); err != nil {
		return err
	}
	return tx.Commit(ctx)
}
