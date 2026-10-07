// Command social runs Direct Social: `social api`, `social worker` or
// `social migrate`.
package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/mathieux51/estceque/services/social/internal/api"
	"github.com/mathieux51/estceque/services/social/internal/config"
	"github.com/mathieux51/estceque/services/social/internal/db"
	"github.com/mathieux51/estceque/services/social/internal/mail"
	"github.com/mathieux51/estceque/services/social/internal/storage"
	"github.com/mathieux51/estceque/services/social/internal/worker"
)

func main() {
	log := slog.New(slog.NewTextHandler(os.Stderr, nil))
	if len(os.Args) != 2 {
		fmt.Fprintln(os.Stderr, "usage: social api|worker|migrate")
		os.Exit(2)
	}
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	if err := run(ctx, os.Args[1], log); err != nil {
		log.Error("stopped", "err", err)
		os.Exit(1)
	}
}

func run(ctx context.Context, command string, log *slog.Logger) error {
	cfg := config.Load()
	pool, err := connect(ctx, cfg.DatabaseURL, log)
	if err != nil {
		return err
	}
	defer pool.Close()
	if command == "migrate" {
		return db.Migrate(ctx, pool)
	}
	store, err := storage.New(ctx, cfg.S3Endpoint, cfg.S3PublicEndpoint, cfg.S3AccessKey, cfg.S3SecretKey,
		cfg.S3Bucket, cfg.S3UseSSL)
	if err != nil {
		return err
	}
	switch command {
	case "worker":
		log.Info("worker started")
		return (&worker.Worker{DB: pool, Store: store, Cfg: cfg, Log: log}).Run(ctx)
	case "api":
		a := &api.API{DB: pool, Store: store, Mail: mail.Mailer{Addr: cfg.SMTPAddr, From: cfg.MailFrom}, Cfg: cfg, Log: log}
		server := &http.Server{Addr: cfg.Addr, Handler: a.Handler(), ReadHeaderTimeout: 10 * time.Second}
		go func() {
			<-ctx.Done()
			shutdown, cancel := context.WithTimeout(context.Background(), 10*time.Second)
			defer cancel()
			_ = server.Shutdown(shutdown)
		}()
		log.Info("api listening", "addr", cfg.Addr)
		if err := server.ListenAndServe(); !errors.Is(err, http.ErrServerClosed) {
			return err
		}
		return nil
	}
	return fmt.Errorf("unknown command %q", command)
}

// connect waits for Postgres, which may still be starting with Compose.
func connect(ctx context.Context, url string, log *slog.Logger) (*pgxpool.Pool, error) {
	for attempt := 1; ; attempt++ {
		pool, err := db.Connect(ctx, url)
		if err == nil || attempt == 30 || ctx.Err() != nil {
			return pool, err
		}
		log.Info("waiting for the database", "err", err)
		time.Sleep(time.Second)
	}
}
