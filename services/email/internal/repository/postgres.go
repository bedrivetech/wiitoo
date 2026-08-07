package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/bedrivetech/wiitoo/email/internal/model"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// EmailRepository handles database operations for email providers, templates, and logs.
type EmailRepository struct {
	pool *pgxpool.Pool
}

// NewEmailRepository creates a new EmailRepository.
func NewEmailRepository(pool *pgxpool.Pool) *EmailRepository {
	return &EmailRepository{pool: pool}
}

// ─── Providers ────────────────────────────────────────────────

// ListProviders returns all email providers.
func (r *EmailRepository) ListProviders(ctx context.Context) ([]model.EmailProvider, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, name, provider_type, config, priority, is_active, weight,
		       last_health_check, is_healthy, from_name, from_email,
		       created_at, updated_at
		FROM email_providers
		ORDER BY priority ASC, name ASC
	`)
	if err != nil {
		return nil, fmt.Errorf("list providers: %w", err)
	}
	defer rows.Close()

	var providers []model.EmailProvider
	for rows.Next() {
		p, err := scanProvider(rows)
		if err != nil {
			return nil, err
		}
		providers = append(providers, p)
	}
	return providers, nil
}

// ListActiveProviders returns all active and healthy email providers.
func (r *EmailRepository) ListActiveProviders(ctx context.Context) ([]model.EmailProvider, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, name, provider_type, config, priority, is_active, weight,
		       last_health_check, is_healthy, from_name, from_email,
		       created_at, updated_at
		FROM email_providers
		WHERE is_active = true AND is_healthy = true
		ORDER BY priority ASC, name ASC
	`)
	if err != nil {
		return nil, fmt.Errorf("list active providers: %w", err)
	}
	defer rows.Close()

	var providers []model.EmailProvider
	for rows.Next() {
		p, err := scanProvider(rows)
		if err != nil {
			return nil, err
		}
		providers = append(providers, p)
	}
	return providers, nil
}

// GetProvider returns a single provider by ID.
func (r *EmailRepository) GetProvider(ctx context.Context, id string) (*model.EmailProvider, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, name, provider_type, config, priority, is_active, weight,
		       last_health_check, is_healthy, from_name, from_email,
		       created_at, updated_at
		FROM email_providers WHERE id = $1
	`, id)

	p, err := scanSingleProvider(row)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("get provider: %w", err)
	}
	return p, nil
}

// CreateProvider inserts a new email provider.
func (r *EmailRepository) CreateProvider(ctx context.Context, req model.CreateProviderRequest) (*model.EmailProvider, error) {
	configBytes, err := json.Marshal(req.Config)
	if err != nil {
		return nil, fmt.Errorf("marshal config: %w", err)
	}

	fromName := req.FromName
	if fromName == "" {
		fromName = "Wiitoo"
	}

	row := r.pool.QueryRow(ctx, `
		INSERT INTO email_providers (name, provider_type, config, priority, weight, from_name, from_email)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, name, provider_type, config, priority, is_active, weight,
		          last_health_check, is_healthy, from_name, from_email,
		          created_at, updated_at
	`, req.Name, string(req.ProviderType), configBytes, req.Priority, req.Weight, fromName, req.FromEmail)

	p, err := scanSingleProvider(row)
	if err != nil {
		return nil, fmt.Errorf("create provider: %w", err)
	}
	return p, nil
}

// UpdateProvider updates an existing email provider.
func (r *EmailRepository) UpdateProvider(ctx context.Context, id string, req model.UpdateProviderRequest) (*model.EmailProvider, error) {
	existing, err := r.GetProvider(ctx, id)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, nil
	}

	var sets []string
	args := []any{}
	argIdx := 1

	if req.Name != nil {
		sets = append(sets, "name = $"+strconv.Itoa(argIdx))
		args = append(args, *req.Name)
		argIdx++
	}
	if req.ProviderType != nil {
		sets = append(sets, "provider_type = $"+strconv.Itoa(argIdx))
		args = append(args, string(*req.ProviderType))
		argIdx++
	}
	if req.Config != nil {
		configBytes, err := json.Marshal(*req.Config)
		if err != nil {
			return nil, fmt.Errorf("marshal config: %w", err)
		}
		sets = append(sets, "config = $"+strconv.Itoa(argIdx))
		args = append(args, configBytes)
		argIdx++
	}
	if req.Priority != nil {
		sets = append(sets, "priority = $"+strconv.Itoa(argIdx))
		args = append(args, *req.Priority)
		argIdx++
	}
	if req.IsActive != nil {
		sets = append(sets, "is_active = $"+strconv.Itoa(argIdx))
		args = append(args, *req.IsActive)
		argIdx++
	}
	if req.Weight != nil {
		sets = append(sets, "weight = $"+strconv.Itoa(argIdx))
		args = append(args, *req.Weight)
		argIdx++
	}
	if req.FromName != nil {
		sets = append(sets, "from_name = $"+strconv.Itoa(argIdx))
		args = append(args, *req.FromName)
		argIdx++
	}
	if req.FromEmail != nil {
		sets = append(sets, "from_email = $"+strconv.Itoa(argIdx))
		args = append(args, *req.FromEmail)
		argIdx++
	}

	sets = append(sets, "updated_at = NOW()")

	if len(args) == 0 {
		return existing, nil
	}

	args = append(args, id)
	query := fmt.Sprintf(`
		UPDATE email_providers SET %s
		WHERE id = $%d
		RETURNING id, name, provider_type, config, priority, is_active, weight,
		          last_health_check, is_healthy, from_name, from_email,
		          created_at, updated_at
	`, strings.Join(sets, ", "), argIdx)

	row := r.pool.QueryRow(ctx, query, args...)
	p, err := scanSingleProvider(row)
	if err != nil {
		return nil, fmt.Errorf("update provider: %w", err)
	}
	return p, nil
}

// DeleteProvider deletes an email provider by ID.
func (r *EmailRepository) DeleteProvider(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM email_providers WHERE id = $1`, id)
	return err
}

// UpdateProviderHealth updates the health check status of a provider.
func (r *EmailRepository) UpdateProviderHealth(ctx context.Context, id string, isHealthy bool) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE email_providers SET is_healthy = $1, last_health_check = NOW(), updated_at = NOW()
		WHERE id = $2
	`, isHealthy, id)
	return err
}

// ─── Templates ────────────────────────────────────────────────

// ListTemplates returns all email templates.
func (r *EmailRepository) ListTemplates(ctx context.Context) ([]model.EmailTemplate, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, name, description, subject, text_body, html_body, variables, is_system,
		       created_at, updated_at
		FROM email_templates
		ORDER BY name ASC
	`)
	if err != nil {
		return nil, fmt.Errorf("list templates: %w", err)
	}
	defer rows.Close()

	var templates []model.EmailTemplate
	for rows.Next() {
		t, err := scanTemplate(rows)
		if err != nil {
			return nil, err
		}
		templates = append(templates, t)
	}
	return templates, nil
}

// GetTemplate returns a single template by ID.
func (r *EmailRepository) GetTemplate(ctx context.Context, id string) (*model.EmailTemplate, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, name, description, subject, text_body, html_body, variables, is_system,
		       created_at, updated_at
		FROM email_templates WHERE id = $1
	`, id)

	t, err := scanSingleTemplate(row)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("get template: %w", err)
	}
	return t, nil
}

// GetTemplateByName returns a single template by name.
func (r *EmailRepository) GetTemplateByName(ctx context.Context, name string) (*model.EmailTemplate, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, name, description, subject, text_body, html_body, variables, is_system,
		       created_at, updated_at
		FROM email_templates WHERE name = $1
	`, name)

	t, err := scanSingleTemplate(row)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("get template by name: %w", err)
	}
	return t, nil
}

// CreateTemplate inserts a new email template.
func (r *EmailRepository) CreateTemplate(ctx context.Context, req model.CreateTemplateRequest) (*model.EmailTemplate, error) {
	if req.Variables == nil {
		req.Variables = []string{}
	}

	row := r.pool.QueryRow(ctx, `
		INSERT INTO email_templates (name, description, subject, text_body, html_body, variables)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, name, description, subject, text_body, html_body, variables, is_system,
		          created_at, updated_at
	`, req.Name, req.Description, req.Subject, req.TextBody, req.HTMLBody, req.Variables)

	t, err := scanSingleTemplate(row)
	if err != nil {
		return nil, fmt.Errorf("create template: %w", err)
	}
	return t, nil
}

// UpdateTemplate updates an existing email template.
func (r *EmailRepository) UpdateTemplate(ctx context.Context, id string, req model.UpdateTemplateRequest) (*model.EmailTemplate, error) {
	existing, err := r.GetTemplate(ctx, id)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, nil
	}

	var sets []string
	args := []any{}
	argIdx := 1

	if req.Name != nil {
		sets = append(sets, "name = $"+strconv.Itoa(argIdx))
		args = append(args, *req.Name)
		argIdx++
	}
	if req.Description != nil {
		sets = append(sets, "description = $"+strconv.Itoa(argIdx))
		args = append(args, *req.Description)
		argIdx++
	}
	if req.Subject != nil {
		sets = append(sets, "subject = $"+strconv.Itoa(argIdx))
		args = append(args, *req.Subject)
		argIdx++
	}
	if req.TextBody != nil {
		sets = append(sets, "text_body = $"+strconv.Itoa(argIdx))
		args = append(args, *req.TextBody)
		argIdx++
	}
	if req.HTMLBody != nil {
		sets = append(sets, "html_body = $"+strconv.Itoa(argIdx))
		args = append(args, *req.HTMLBody)
		argIdx++
	}
	if req.Variables != nil {
		sets = append(sets, "variables = $"+strconv.Itoa(argIdx))
		args = append(args, *req.Variables)
		argIdx++
	}

	sets = append(sets, "updated_at = NOW()")

	if len(args) == 0 {
		return existing, nil
	}

	args = append(args, id)
	query := fmt.Sprintf(`
		UPDATE email_templates SET %s
		WHERE id = $%d
		RETURNING id, name, description, subject, text_body, html_body, variables, is_system,
		          created_at, updated_at
	`, strings.Join(sets, ", "), argIdx)

	row := r.pool.QueryRow(ctx, query, args...)
	t, err := scanSingleTemplate(row)
	if err != nil {
		return nil, fmt.Errorf("update template: %w", err)
	}
	return t, nil
}

// DeleteTemplate deletes an email template by ID.
func (r *EmailRepository) DeleteTemplate(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM email_templates WHERE id = $1 AND is_system = false`, id)
	return err
}

// ─── Email Log ────────────────────────────────────────────────

// LogEmail inserts a log entry for an email send attempt.
func (r *EmailRepository) LogEmail(ctx context.Context, entry model.EmailLogEntry) error {
	var metadataBytes []byte
	if entry.Metadata != nil {
		metadataBytes, _ = json.Marshal(entry.Metadata)
	}

	_, err := r.pool.Exec(ctx, `
		INSERT INTO email_log (to_email, subject, provider_id, template_id, status, error, metadata, sent_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`, entry.ToEmail, entry.Subject, entry.ProviderID, entry.TemplateID, entry.Status, entry.Error, metadataBytes, entry.SentAt)

	if err != nil {
		return fmt.Errorf("log email: %w", err)
	}
	return nil
}

// ListEmailLog returns paginated email log entries with optional filters.
func (r *EmailRepository) ListEmailLog(ctx context.Context, search, status, providerID string, limit, offset int) ([]model.EmailLogEntry, int, error) {
	where := []string{"1=1"}
	args := []any{}
	argIdx := 1

	if search != "" {
		where = append(where, "(to_email ILIKE $"+strconv.Itoa(argIdx)+" OR subject ILIKE $"+strconv.Itoa(argIdx)+")")
		args = append(args, "%"+search+"%")
		argIdx++
	}
	if status != "" {
		where = append(where, "status = $"+strconv.Itoa(argIdx))
		args = append(args, status)
		argIdx++
	}
	if providerID != "" {
		where = append(where, "provider_id = $"+strconv.Itoa(argIdx))
		args = append(args, providerID)
		argIdx++
	}

	whereClause := strings.Join(where, " AND ")

	var total int
	countQuery := "SELECT COUNT(*) FROM email_log WHERE " + whereClause
	if err := r.pool.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count log: %w", err)
	}

	query := `SELECT id, to_email, subject, provider_id, template_id, status, error, metadata, sent_at
	          FROM email_log WHERE ` + whereClause + ` ORDER BY sent_at DESC LIMIT $` +
		strconv.Itoa(argIdx) + ` OFFSET $` + strconv.Itoa(argIdx+1)
	args = append(args, limit, offset)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("list log: %w", err)
	}
	defer rows.Close()

	var entries []model.EmailLogEntry
	for rows.Next() {
		var entry model.EmailLogEntry
		var metadataBytes []byte
		var providerID, templateID, errorStr *string

		if err := rows.Scan(&entry.ID, &entry.ToEmail, &entry.Subject,
			&providerID, &templateID, &entry.Status, &errorStr, &metadataBytes, &entry.SentAt); err != nil {
			return nil, 0, fmt.Errorf("scan log: %w", err)
		}

		entry.ProviderID = providerID
		entry.TemplateID = templateID
		if errorStr != nil {
			entry.Error = errorStr
		}
		if metadataBytes != nil {
			json.Unmarshal(metadataBytes, &entry.Metadata)
		}

		entries = append(entries, entry)
	}

	return entries, total, nil
}

// ─── Scan helpers ─────────────────────────────────────────────

type providerRow interface {
	Scan(dest ...any) error
}

func scanProvider(row providerRow) (model.EmailProvider, error) {
	var p model.EmailProvider
	var configBytes []byte
	var lastHealthCheck *time.Time

	err := row.Scan(&p.ID, &p.Name, &p.ProviderType, &configBytes,
		&p.Priority, &p.IsActive, &p.Weight,
		&lastHealthCheck, &p.IsHealthy, &p.FromName, &p.FromEmail,
		&p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return p, fmt.Errorf("scan provider: %w", err)
	}

	p.LastHealthCheck = lastHealthCheck
	if configBytes != nil {
		json.Unmarshal(configBytes, &p.Config)
	}

	return p, nil
}

func scanSingleProvider(row pgx.Row) (*model.EmailProvider, error) {
	p, err := scanProvider(row)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func scanTemplate(row providerRow) (model.EmailTemplate, error) {
	var t model.EmailTemplate
	err := row.Scan(&t.ID, &t.Name, &t.Description, &t.Subject,
		&t.TextBody, &t.HTMLBody, &t.Variables, &t.IsSystem,
		&t.CreatedAt, &t.UpdatedAt)
	if err != nil {
		return t, fmt.Errorf("scan template: %w", err)
	}
	return t, nil
}

func scanSingleTemplate(row pgx.Row) (*model.EmailTemplate, error) {
	t, err := scanTemplate(row)
	if err != nil {
		return nil, err
	}
	return &t, nil
}