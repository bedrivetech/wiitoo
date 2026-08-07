package repository

import (
	"context"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// NotificationTemplate represents a notification template for admin management.
type NotificationTemplate struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Type      string    `json:"type"`
	Title     string    `json:"title"`
	Body      string    `json:"body"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// NotificationRepository handles notification template data for admin operations.
type NotificationRepository struct {
	pool *pgxpool.Pool
}

func NewNotificationRepository(pool *pgxpool.Pool) *NotificationRepository {
	return &NotificationRepository{pool: pool}
}

func (r *NotificationRepository) CreateTemplate(ctx context.Context, tpl *NotificationTemplate) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO notification_templates (id, name, type, title, body, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
		tpl.ID, tpl.Name, tpl.Type, tpl.Title, tpl.Body)
	return err
}

func (r *NotificationRepository) GetTemplate(ctx context.Context, id string) (*NotificationTemplate, error) {
	tpl := &NotificationTemplate{}
	err := r.pool.QueryRow(ctx,
		`SELECT id, name, type, title, body, created_at, updated_at
		 FROM notification_templates WHERE id = $1`, id).Scan(
		&tpl.ID, &tpl.Name, &tpl.Type, &tpl.Title, &tpl.Body, &tpl.CreatedAt, &tpl.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return tpl, nil
}

func (r *NotificationRepository) ListTemplates(ctx context.Context) ([]NotificationTemplate, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, name, type, title, body, created_at, updated_at
		 FROM notification_templates ORDER BY name ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var templates []NotificationTemplate
	for rows.Next() {
		var t NotificationTemplate
		if err := rows.Scan(&t.ID, &t.Name, &t.Type, &t.Title, &t.Body, &t.CreatedAt, &t.UpdatedAt); err != nil {
			return nil, err
		}
		templates = append(templates, t)
	}
	return templates, nil
}

func (r *NotificationRepository) UpdateTemplate(ctx context.Context, id string, name, typ, title, body *string) (*NotificationTemplate, error) {
	sets := []string{"updated_at = NOW()"}
	args := []any{id}
	argIdx := 2

	if name != nil {
		sets = append(sets, "name = $"+strconv.Itoa(argIdx))
		args = append(args, *name)
		argIdx++
	}
	if typ != nil {
		sets = append(sets, "type = $"+strconv.Itoa(argIdx))
		args = append(args, *typ)
		argIdx++
	}
	if title != nil {
		sets = append(sets, "title = $"+strconv.Itoa(argIdx))
		args = append(args, *title)
		argIdx++
	}
	if body != nil {
		sets = append(sets, "body = $"+strconv.Itoa(argIdx))
		args = append(args, *body)
		argIdx++
	}

	if len(sets) == 1 { // only updated_at
		return r.GetTemplate(ctx, id)
	}

	setClause := strings.Join(sets, ", ")
	query := `UPDATE notification_templates SET ` + setClause + ` WHERE id = $1
	          RETURNING id, name, type, title, body, created_at, updated_at`

	tpl := &NotificationTemplate{}
	err := r.pool.QueryRow(ctx, query, args...).Scan(
		&tpl.ID, &tpl.Name, &tpl.Type, &tpl.Title, &tpl.Body, &tpl.CreatedAt, &tpl.UpdatedAt)
	return tpl, err
}

func (r *NotificationRepository) DeleteTemplate(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM notification_templates WHERE id = $1`, id)
	return err
}