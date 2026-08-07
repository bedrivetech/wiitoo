package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/fusion-platform/video/internal/model"
	"github.com/jackc/pgx/v5/pgxpool"
)

type VideoRepository struct {
	pool *pgxpool.Pool
}

func NewVideoRepository(pool *pgxpool.Pool) *VideoRepository {
	return &VideoRepository{pool: pool}
}

func (r *VideoRepository) Create(ctx context.Context, v *model.Video) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO videos (id, upload_id, filename, content_type, size_bytes, storage_key, status, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)`,
		v.ID, v.UploadID, v.Filename, v.ContentType, v.SizeBytes, v.StorageKey, v.Status, v.CreatedAt)
	return err
}

func (r *VideoRepository) GetByID(ctx context.Context, id string) (*model.Video, error) {
	v := &model.Video{}
	err := r.pool.QueryRow(ctx,
		`SELECT id, upload_id, user_id, filename, content_type, size_bytes, storage_key, hls_url, thumbnail, status, duration, category, tags, is_mature, created_at, updated_at, ended_at
		 FROM videos WHERE id = $1`, id).Scan(
		&v.ID, &v.UploadID, &v.UserID, &v.Filename, &v.ContentType, &v.SizeBytes,
		&v.StorageKey, &v.HLSURL, &v.Thumbnail, &v.Status, &v.Duration, &v.Category, &v.Tags, &v.IsMature,
		&v.CreatedAt, &v.UpdatedAt, &v.EndedAt)
	if err != nil {
		return nil, fmt.Errorf("video not found: %w", err)
	}
	return v, nil
}

func (r *VideoRepository) Update(ctx context.Context, v *model.Video) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE videos SET status=$1, hls_url=$2, thumbnail=$3, duration=$4, category=$5, tags=$6, is_mature=$7, updated_at=$8
		 WHERE id=$9`,
		v.Status, v.HLSURL, v.Thumbnail, v.Duration, v.Category, v.Tags, v.IsMature, time.Now(), v.ID)
	return err
}

func (r *VideoRepository) List(ctx context.Context, category string, limit, offset int) ([]*model.Video, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, upload_id, user_id, filename, content_type, size_bytes, storage_key, hls_url, thumbnail, status, duration, category, tags, is_mature, created_at
		 FROM videos WHERE status='ready' ORDER BY created_at DESC LIMIT $1 OFFSET $2`, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var videos []*model.Video
	for rows.Next() {
		v := &model.Video{}
		rows.Scan(&v.ID, &v.UploadID, &v.UserID, &v.Filename, &v.ContentType, &v.SizeBytes,
			&v.StorageKey, &v.HLSURL, &v.Thumbnail, &v.Status, &v.Duration, &v.Category, &v.Tags, &v.IsMature, &v.CreatedAt)
		videos = append(videos, v)
	}
	return videos, nil
}
