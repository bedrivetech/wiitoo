package repository

import (
	"context"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/bedrivetech/wiitoo/services/video/internal/model"
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

// --- Admin methods ---

// AdminListVideos returns a paginated, filtered list of all videos for admin.
func (r *VideoRepository) AdminListVideos(ctx context.Context, search, status, creatorID, category string, limit, offset int) ([]*model.Video, int, error) {
	where := []string{"1=1"}
	args := []any{}
	argIdx := 1

	if search != "" {
		where = append(where, "(filename ILIKE $"+strconv.Itoa(argIdx)+" OR category ILIKE $"+strconv.Itoa(argIdx)+")")
		args = append(args, "%"+search+"%")
		argIdx++
	}
	if status != "" {
		where = append(where, "status = $"+strconv.Itoa(argIdx))
		args = append(args, status)
		argIdx++
	}
	if creatorID != "" {
		where = append(where, "user_id = $"+strconv.Itoa(argIdx))
		args = append(args, creatorID)
		argIdx++
	}
	if category != "" {
		where = append(where, "category = $"+strconv.Itoa(argIdx))
		args = append(args, category)
		argIdx++
	}

	whereClause := strings.Join(where, " AND ")

	var total int
	if err := r.pool.QueryRow(ctx, "SELECT COUNT(*) FROM videos WHERE "+whereClause, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	query := `SELECT id, upload_id, user_id, filename, content_type, size_bytes, storage_key, hls_url, thumbnail, status, duration, category, tags, is_mature, created_at, updated_at, ended_at
	          FROM videos WHERE ` + whereClause + ` ORDER BY created_at DESC LIMIT $` + strconv.Itoa(argIdx) + ` OFFSET $` + strconv.Itoa(argIdx+1)
	args = append(args, limit, offset)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var videos []*model.Video
	for rows.Next() {
		v := &model.Video{}
		rows.Scan(&v.ID, &v.UploadID, &v.UserID, &v.Filename, &v.ContentType, &v.SizeBytes,
			&v.StorageKey, &v.HLSURL, &v.Thumbnail, &v.Status, &v.Duration, &v.Category, &v.Tags, &v.IsMature,
			&v.CreatedAt, &v.UpdatedAt, &v.EndedAt)
		videos = append(videos, v)
	}
	return videos, total, nil
}

// AdminUpdateVideo updates video metadata (title/filename, description/category, visibility/status, featured).
func (r *VideoRepository) AdminUpdateVideo(ctx context.Context, id string, title *string, description *string, visibility *string, featured *bool) (*model.Video, error) {
	sets := []string{"updated_at = NOW()"}
	args := []any{id}
	argIdx := 2

	if title != nil {
		sets = append(sets, "filename = $"+strconv.Itoa(argIdx))
		args = append(args, *title)
		argIdx++
	}
	if description != nil {
		sets = append(sets, "category = $"+strconv.Itoa(argIdx))
		args = append(args, *description)
		argIdx++
	}
	if visibility != nil {
		sets = append(sets, "status = $"+strconv.Itoa(argIdx))
		args = append(args, *visibility)
		argIdx++
	}
	if featured != nil {
		sets = append(sets, "is_mature = $"+strconv.Itoa(argIdx))
		args = append(args, *featured)
		argIdx++
	}

	setClause := strings.Join(sets, ", ")
	query := `UPDATE videos SET ` + setClause + ` WHERE id = $1
	          RETURNING id, upload_id, user_id, filename, content_type, size_bytes, storage_key, hls_url, thumbnail, status, duration, category, tags, is_mature, created_at, updated_at, ended_at`

	v := &model.Video{}
	err := r.pool.QueryRow(ctx, query, args...).Scan(
		&v.ID, &v.UploadID, &v.UserID, &v.Filename, &v.ContentType, &v.SizeBytes,
		&v.StorageKey, &v.HLSURL, &v.Thumbnail, &v.Status, &v.Duration, &v.Category, &v.Tags, &v.IsMature,
		&v.CreatedAt, &v.UpdatedAt, &v.EndedAt)
	if err != nil {
		return nil, err
	}
	return v, nil
}

// AdminDeleteVideo hard-deletes a video by ID.
func (r *VideoRepository) AdminDeleteVideo(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM videos WHERE id = $1`, id)
	return err
}
