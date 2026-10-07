// Package jobs is a small job queue stored in Postgres.
package jobs

import (
	"context"
	"encoding/json"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

const (
	ProcessEpisode    = "process_episode"
	TranscribeEpisode = "transcribe_episode"
)

type EpisodePayload struct {
	EpisodeID int64 `json:"episodeId"`
}

type Job struct {
	ID       int64
	Kind     string
	Payload  json.RawMessage
	Attempts int
}

// Add queues a job using a pool or a transaction.
func Add(ctx context.Context, q pgx.Tx, kind string, payload any) error {
	raw, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	_, err = q.Exec(ctx, `INSERT INTO jobs (kind, payload) VALUES ($1, $2)`, kind, raw)
	return err
}

// AddNow queues a job outside of a transaction.
func AddNow(ctx context.Context, pool *pgxpool.Pool, kind string, payload any) error {
	raw, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	_, err = pool.Exec(ctx, `INSERT INTO jobs (kind, payload) VALUES ($1, $2)`, kind, raw)
	return err
}

// Claim takes the next queued job, or returns nil when there is none.
func Claim(ctx context.Context, pool *pgxpool.Pool) (*Job, error) {
	var job Job
	err := pool.QueryRow(ctx, `
		UPDATE jobs SET status = 'running', attempts = attempts + 1, updated_at = now()
		WHERE id = (
			SELECT id FROM jobs WHERE status = 'queued' AND run_after <= now()
			ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 1)
		RETURNING id, kind, payload, attempts`).Scan(&job.ID, &job.Kind, &job.Payload, &job.Attempts)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &job, nil
}

// Finish records the outcome; failed jobs are retried up to 3 times.
func Finish(ctx context.Context, pool *pgxpool.Pool, job *Job, jobErr error) (retrying bool, err error) {
	if jobErr == nil {
		_, err = pool.Exec(ctx, `UPDATE jobs SET status = 'done', updated_at = now() WHERE id = $1`, job.ID)
		return false, err
	}
	if job.Attempts < 3 {
		_, err = pool.Exec(ctx, `UPDATE jobs SET status = 'queued', last_error = $2, updated_at = now(),
			run_after = now() + make_interval(secs => $3) WHERE id = $1`, job.ID, jobErr.Error(), 30*job.Attempts)
		return true, err
	}
	_, err = pool.Exec(ctx, `UPDATE jobs SET status = 'failed', last_error = $2, updated_at = now() WHERE id = $1`,
		job.ID, jobErr.Error())
	return false, err
}

// Recover requeues jobs left running by a worker that stopped.
func Recover(ctx context.Context, pool *pgxpool.Pool) error {
	_, err := pool.Exec(ctx, `UPDATE jobs SET status = 'queued', updated_at = now()
		WHERE status = 'running' AND updated_at < now() - interval '30 minutes'`)
	return err
}
