package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/fusion-platform/content/internal/config"
)

type ContentService struct {
	pool *pgxpool.Pool
	cfg  *svcconfig.Config
}

func NewContentService(pool *pgxpool.Pool, cfg *svcconfig.Config) *ContentService {
	return &ContentService{pool: pool, cfg: cfg}
}

type Category struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Slug        string `json:"slug"`
	Description string `json:"description"`
	Thumbnail   string `json:"thumbnail"`
	ViewerCount int    `json:"viewerCount"`
	StreamCount int    `json:"streamCount"`
}

type SearchResult struct {
	ID          string  `json:"id"`
	Type        string  `json:"type"` // stream, video, clip
	Title       string  `json:"title"`
	Thumbnail   string  `json:"thumbnail"`
	ViewerCount int     `json:"viewerCount"`
	Username    string  `json:"username"`
	Score       float64 `json:"score"`
}

func (s *ContentService) CreateCategory(ctx context.Context, name, description, thumbnail string) (*Category, error) {
	c := &Category{
		ID:          uuid.New().String(),
		Name:        name,
		Slug:        slugify(name),
		Description: description,
		Thumbnail:   thumbnail,
	}
	_, err := s.pool.Exec(ctx,
		`INSERT INTO categories (id, name, slug, description, thumbnail, created_at)
		 VALUES ($1, $2, $3, $4, $5, NOW())`,
		c.ID, c.Name, c.Slug, c.Description, c.Thumbnail)
	return c, err
}

func (s *ContentService) ListCategories(ctx context.Context) ([]Category, error) {
	rows, err := s.pool.Query(ctx,
		`SELECT id, name, slug, description, thumbnail, viewer_count, stream_count
		 FROM categories ORDER BY viewer_count DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var cats []Category
	for rows.Next() {
		var c Category
		rows.Scan(&c.ID, &c.Name, &c.Slug, &c.Description, &c.Thumbnail, &c.ViewerCount, &c.StreamCount)
		cats = append(cats, c)
	}
	return cats, nil
}

func (s *ContentService) GetCategory(ctx context.Context, id string) (*Category, error) {
	c := &Category{}
	err := s.pool.QueryRow(ctx,
		`SELECT id, name, slug, description, thumbnail, viewer_count, stream_count
		 FROM categories WHERE id = $1`, id).Scan(
		&c.ID, &c.Name, &c.Slug, &c.Description, &c.Thumbnail, &c.ViewerCount, &c.StreamCount)
	return c, err
}

func (s *ContentService) FollowCategory(ctx context.Context, userID, categoryID string) error {
	_, err := s.pool.Exec(ctx,
		`INSERT INTO category_followers (user_id, category_id, created_at)
		 VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING`, userID, categoryID)
	return err
}

func (s *ContentService) Search(ctx context.Context, query string, limit, offset int) ([]SearchResult, error) {
	rows, err := s.pool.Query(ctx,
		`SELECT id, 'stream', title, thumbnail, viewer_count, user_id as username
		 FROM streams WHERE status='live' AND to_tsvector('english', title || ' ' || COALESCE(category, '')) @@ plainto_tsquery('english', $1)
		 LIMIT $2 OFFSET $3`, query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []SearchResult
	for rows.Next() {
		var r SearchResult
		rows.Scan(&r.ID, &r.Type, &r.Title, &r.Thumbnail, &r.ViewerCount, &r.Username)
		r.Score = 1.0
		results = append(results, r)
	}
	return results, nil
}

func (s *ContentService) ReportContent(ctx context.Context, reporterID, contentID, contentType, reason string) error {
	_, err := s.pool.Exec(ctx,
		`INSERT INTO content_reports (id, reporter_id, content_id, content_type, reason, status, created_at)
		 VALUES ($1, $2, $3, $4, $5, 'pending', NOW())`,
		uuid.New().String(), reporterID, contentID, contentType, reason)
	return err
}

func (s *ContentService) Trending(ctx context.Context, limit int) ([]SearchResult, error) {
	rows, err := s.pool.Query(ctx,
		`SELECT s.id, 'stream', s.title, s.thumbnail, s.viewer_count, s.user_id
		 FROM streams s WHERE s.status='live'
		 ORDER BY s.viewer_count DESC LIMIT $1`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var results []SearchResult
	for rows.Next() {
		var r SearchResult
		rows.Scan(&r.ID, &r.Type, &r.Title, &r.Thumbnail, &r.ViewerCount, &r.Username)
		r.Score = float64(r.ViewerCount)
		results = append(results, r)
	}
	return results, nil
}

func (s *ContentService) Recommended(ctx context.Context, userID string, limit int) ([]SearchResult, error) {
	if userID == "" {
		return s.Trending(ctx, limit)
	}

	rows, err := s.pool.Query(ctx,
		`SELECT s.id, 'stream', s.title, s.thumbnail, s.viewer_count, s.user_id
		 FROM streams s
		 WHERE s.status='live' AND s.category IN (
		   SELECT cf.category_id FROM category_followers cf WHERE cf.user_id = $1
		 )
		 ORDER BY s.viewer_count DESC LIMIT $2`, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var results []SearchResult
	for rows.Next() {
		var r SearchResult
		rows.Scan(&r.ID, &r.Type, &r.Title, &r.Thumbnail, &r.ViewerCount, &r.Username)
		r.Score = float64(r.ViewerCount)
		results = append(results, r)
	}
	return results, nil
}

func slugify(s string) string {
	// Simple slugify for now
	result := make([]byte, 0, len(s))
	for _, c := range s {
		if (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') || c == '-' {
			result = append(result, byte(c))
		} else if c >= 'A' && c <= 'Z' {
			result = append(result, byte(c+32))
		} else if c == ' ' {
			result = append(result, '-')
		}
	}
	return string(result)
}
