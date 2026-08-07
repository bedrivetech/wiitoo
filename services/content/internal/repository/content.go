package repository

import (
	"context"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Category represents a content category.
type Category struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Slug        string `json:"slug"`
	Description string `json:"description"`
	Thumbnail   string `json:"thumbnail"`
	ViewerCount int    `json:"viewerCount"`
	StreamCount int    `json:"streamCount"`
}

// ContentReport represents a user-submitted content report.
type ContentReport struct {
	ID          string    `json:"id"`
	ReporterID  string    `json:"reporterId"`
	ContentID   string    `json:"contentId"`
	ContentType string    `json:"contentType"`
	Reason      string    `json:"reason"`
	Status      string    `json:"status"` // pending, resolved, dismissed
	CreatedAt   time.Time `json:"createdAt"`
}

// Clip represents a video clip.
type Clip struct {
	ID        string    `json:"id"`
	SourceID  string    `json:"sourceId"`
	Title     string    `json:"title"`
	UserID    string    `json:"userId"`
	URL       string    `json:"url"`
	Duration  float64   `json:"duration"`
	CreatedAt time.Time `json:"createdAt"`
}

// ContentRepository handles admin queries for content data.
type ContentRepository struct {
	pool *pgxpool.Pool
}

func NewContentRepository(pool *pgxpool.Pool) *ContentRepository {
	return &ContentRepository{pool: pool}
}

// --- Categories ---

func (r *ContentRepository) CreateCategory(ctx context.Context, cat *Category) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO categories (id, name, slug, description, thumbnail, created_at)
		 VALUES ($1, $2, $3, $4, $5, NOW())`,
		cat.ID, cat.Name, cat.Slug, cat.Description, cat.Thumbnail)
	return err
}

func (r *ContentRepository) GetCategory(ctx context.Context, id string) (*Category, error) {
	cat := &Category{}
	err := r.pool.QueryRow(ctx,
		`SELECT id, name, slug, description, thumbnail, viewer_count, stream_count
		 FROM categories WHERE id = $1`, id).Scan(
		&cat.ID, &cat.Name, &cat.Slug, &cat.Description, &cat.Thumbnail, &cat.ViewerCount, &cat.StreamCount)
	if err != nil {
		return nil, err
	}
	return cat, nil
}

func (r *ContentRepository) ListCategories(ctx context.Context) ([]Category, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, name, slug, description, thumbnail, viewer_count, stream_count
		 FROM categories ORDER BY name ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var cats []Category
	for rows.Next() {
		var c Category
		if err := rows.Scan(&c.ID, &c.Name, &c.Slug, &c.Description, &c.Thumbnail, &c.ViewerCount, &c.StreamCount); err != nil {
			return nil, err
		}
		cats = append(cats, c)
	}
	return cats, nil
}

func (r *ContentRepository) UpdateCategory(ctx context.Context, id string, name, description, thumbnail *string) (*Category, error) {
	sets := []string{}
	args := []any{id}
	argIdx := 2

	if name != nil {
		sets = append(sets, "name = $"+strconv.Itoa(argIdx))
		args = append(args, *name)
		argIdx++
	}
	if description != nil {
		sets = append(sets, "description = $"+strconv.Itoa(argIdx))
		args = append(args, *description)
		argIdx++
	}
	if thumbnail != nil {
		sets = append(sets, "thumbnail = $"+strconv.Itoa(argIdx))
		args = append(args, *thumbnail)
		argIdx++
	}

	if len(sets) == 0 {
		return r.GetCategory(ctx, id)
	}

	setClause := strings.Join(sets, ", ")
	query := `UPDATE categories SET ` + setClause + ` WHERE id = $1
	          RETURNING id, name, slug, description, thumbnail, viewer_count, stream_count`

	cat := &Category{}
	err := r.pool.QueryRow(ctx, query, args...).Scan(
		&cat.ID, &cat.Name, &cat.Slug, &cat.Description, &cat.Thumbnail, &cat.ViewerCount, &cat.StreamCount)
	return cat, err
}

func (r *ContentRepository) DeleteCategory(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM categories WHERE id = $1`, id)
	return err
}

// --- Reports ---

func (r *ContentRepository) ListReports(ctx context.Context, status string, limit, offset int) ([]ContentReport, int, error) {
	where := []string{"1=1"}
	args := []any{}
	argIdx := 1

	if status != "" {
		where = append(where, "status = $"+strconv.Itoa(argIdx))
		args = append(args, status)
		argIdx++
	}

	whereClause := strings.Join(where, " AND ")

	var total int
	if err := r.pool.QueryRow(ctx, "SELECT COUNT(*) FROM content_reports WHERE "+whereClause, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	query := `SELECT id, reporter_id, content_id, content_type, reason, status, created_at
	          FROM content_reports WHERE ` + whereClause + ` ORDER BY created_at DESC LIMIT $` + strconv.Itoa(argIdx) + ` OFFSET $` + strconv.Itoa(argIdx+1)
	args = append(args, limit, offset)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var reports []ContentReport
	for rows.Next() {
		var repo ContentReport
		if err := rows.Scan(&repo.ID, &repo.ReporterID, &repo.ContentID, &repo.ContentType, &repo.Reason, &repo.Status, &repo.CreatedAt); err != nil {
			return nil, 0, err
		}
		reports = append(reports, repo)
	}
	return reports, total, nil
}

func (r *ContentRepository) UpdateReportStatus(ctx context.Context, id, status string) error {
	_, err := r.pool.Exec(ctx, `UPDATE content_reports SET status = $1 WHERE id = $2`, status, id)
	return err
}

// --- Clips ---

func (r *ContentRepository) ListClips(ctx context.Context, search string, limit, offset int) ([]Clip, int, error) {
	where := []string{"1=1"}
	args := []any{}
	argIdx := 1

	if search != "" {
		where = append(where, "(title ILIKE $"+strconv.Itoa(argIdx)+")")
		args = append(args, "%"+search+"%")
		argIdx++
	}

	whereClause := strings.Join(where, " AND ")

	var total int
	if err := r.pool.QueryRow(ctx, "SELECT COUNT(*) FROM clips WHERE "+whereClause, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	query := `SELECT id, source_id, title, user_id, url, duration, created_at
	          FROM clips WHERE ` + whereClause + ` ORDER BY created_at DESC LIMIT $` + strconv.Itoa(argIdx) + ` OFFSET $` + strconv.Itoa(argIdx+1)
	args = append(args, limit, offset)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var clips []Clip
	for rows.Next() {
		var c Clip
		if err := rows.Scan(&c.ID, &c.SourceID, &c.Title, &c.UserID, &c.URL, &c.Duration, &c.CreatedAt); err != nil {
			return nil, 0, err
		}
		clips = append(clips, c)
	}
	return clips, total, nil
}

func (r *ContentRepository) DeleteClip(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM clips WHERE id = $1`, id)
	return err
}