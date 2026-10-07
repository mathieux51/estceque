// Package config reads the settings from environment variables.
package config

import "os"

type Config struct {
	DatabaseURL string
	// Address the API listens on.
	Addr string
	// Public address of the web app, used in emails and RSS links.
	WebURL string
	// S3 storage as seen from the services, and as seen from browsers.
	S3Endpoint       string
	S3PublicEndpoint string
	S3AccessKey      string
	S3SecretKey      string
	S3Bucket         string
	S3UseSSL         bool
	SMTPAddr         string
	MailFrom         string
	WhisperBin       string
	WhisperModel     string
}

func get(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func Load() Config {
	return Config{
		DatabaseURL:      get("DATABASE_URL", "postgres://social:social@localhost:5434/social?sslmode=disable"),
		Addr:             get("ADDR", ":8080"),
		WebURL:           get("WEB_URL", "http://localhost:3002"),
		S3Endpoint:       get("S3_ENDPOINT", "localhost:9000"),
		S3PublicEndpoint: get("S3_PUBLIC_ENDPOINT", "localhost:9000"),
		S3AccessKey:      get("S3_ACCESS_KEY", "social"),
		S3SecretKey:      get("S3_SECRET_KEY", "social-secret"),
		S3Bucket:         get("S3_BUCKET", "social"),
		S3UseSSL:         get("S3_USE_SSL", "false") == "true",
		SMTPAddr:         get("SMTP_ADDR", "localhost:1025"),
		MailFrom:         get("MAIL_FROM", "Direct Social <bonjour@directsocial.local>"),
		WhisperBin:       get("WHISPER_BIN", "whisper-cli"),
		WhisperModel:     get("WHISPER_MODEL", "/models/whisper.bin"),
	}
}
