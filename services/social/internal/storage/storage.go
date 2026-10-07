// Package storage keeps files in S3-compatible storage (MinIO locally, R2 in
// production). Browsers upload and download directly with signed URLs.
package storage

import (
	"context"
	"fmt"
	"io"
	"net/url"
	"os"
	"time"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

type Storage struct {
	client *minio.Client
	// Signs URLs with the address browsers use (the signature covers the host).
	public *minio.Client
	bucket string
}

func New(ctx context.Context, endpoint, publicEndpoint, accessKey, secretKey, bucket string, useSSL bool) (*Storage, error) {
	creds := credentials.NewStaticV4(accessKey, secretKey, "")
	client, err := minio.New(endpoint, &minio.Options{Creds: creds, Secure: useSSL})
	if err != nil {
		return nil, err
	}
	public, err := minio.New(publicEndpoint, &minio.Options{Creds: creds, Secure: useSSL, Region: "us-east-1"})
	if err != nil {
		return nil, err
	}
	exists, err := client.BucketExists(ctx, bucket)
	if err != nil {
		return nil, fmt.Errorf("storage unreachable: %w", err)
	}
	if !exists {
		if err := client.MakeBucket(ctx, bucket, minio.MakeBucketOptions{}); err != nil {
			return nil, err
		}
	}
	return &Storage{client: client, public: public, bucket: bucket}, nil
}

// UploadURL lets a browser PUT one file directly.
func (s *Storage) UploadURL(ctx context.Context, key string) (string, error) {
	u, err := s.public.PresignedPutObject(ctx, s.bucket, key, time.Hour)
	if err != nil {
		return "", err
	}
	return u.String(), nil
}

// DownloadURL lets a browser GET one file (range requests included).
func (s *Storage) DownloadURL(ctx context.Context, key string) (string, error) {
	u, err := s.public.PresignedGetObject(ctx, s.bucket, key, 6*time.Hour, url.Values{})
	if err != nil {
		return "", err
	}
	return u.String(), nil
}

func (s *Storage) Put(ctx context.Context, key string, body io.Reader, size int64, contentType string) error {
	_, err := s.client.PutObject(ctx, s.bucket, key, body, size, minio.PutObjectOptions{ContentType: contentType})
	return err
}

func (s *Storage) PutFile(ctx context.Context, key, path, contentType string) error {
	_, err := s.client.FPutObject(ctx, s.bucket, key, path, minio.PutObjectOptions{ContentType: contentType})
	return err
}

func (s *Storage) GetFile(ctx context.Context, key, path string) error {
	return s.client.FGetObject(ctx, s.bucket, key, path, minio.GetObjectOptions{})
}

func (s *Storage) Size(ctx context.Context, key string) (int64, error) {
	info, err := s.client.StatObject(ctx, s.bucket, key, minio.StatObjectOptions{})
	if err != nil {
		return 0, err
	}
	return info.Size, nil
}

func (s *Storage) Delete(ctx context.Context, key string) error {
	return s.client.RemoveObject(ctx, s.bucket, key, minio.RemoveObjectOptions{})
}

// TempFile creates an empty temporary file and returns its path.
func TempFile(pattern string) (string, error) {
	f, err := os.CreateTemp("", pattern)
	if err != nil {
		return "", err
	}
	name := f.Name()
	return name, f.Close()
}
