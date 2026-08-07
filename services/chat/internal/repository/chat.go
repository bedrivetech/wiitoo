package repository

import (
	"context"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// ChatMessage represents a persisted chat message for admin queries.
type ChatMessage struct {
	ID            string    `json:"id"`
	StreamID      string    `json:"streamId"`
	UserID        string    `json:"userId"`
	Username      string    `json:"username"`
	DisplayName   string    `json:"displayName"`
	Body          string    `json:"body"`
	IsHighlighted bool      `json:"isHighlighted,omitempty"`
	TipAmount     float64   `json:"tipAmount,omitempty"`
	SentAt        time.Time `json:"sentAt"`
}

// ChatRepository handles chat data queries for admin operations.
type ChatRepository struct {
	pool *pgxpool.Pool
}

func NewChatRepository(pool *pgxpool.Pool) *ChatRepository {
	return &ChatRepository{pool: pool}
}

// ListMessages returns paginated chat messages with optional filters.
func (r *ChatRepository) ListMessages(ctx context.Context, search, streamID, userID string, limit, offset int) ([]ChatMessage, int, error) {
	where := []string{"1=1"}
	args := []any{}
	argIdx := 1

	if search != "" {
		where = append(where, "body ILIKE $"+strconv.Itoa(argIdx))
		args = append(args, "%"+search+"%")
		argIdx++
	}
	if streamID != "" {
		where = append(where, "stream_id = $"+strconv.Itoa(argIdx))
		args = append(args, streamID)
		argIdx++
	}
	if userID != "" {
		where = append(where, "user_id = $"+strconv.Itoa(argIdx))
		args = append(args, userID)
		argIdx++
	}

	whereClause := strings.Join(where, " AND ")

	var total int
	if err := r.pool.QueryRow(ctx, "SELECT COUNT(*) FROM chat_messages WHERE "+whereClause, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	query := `SELECT id, stream_id, user_id, username, display_name, body, is_highlighted, tip_amount, sent_at
	          FROM chat_messages WHERE ` + whereClause + ` ORDER BY sent_at DESC LIMIT $` + strconv.Itoa(argIdx) + ` OFFSET $` + strconv.Itoa(argIdx+1)
	args = append(args, limit, offset)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var messages []ChatMessage
	for rows.Next() {
		var m ChatMessage
		if err := rows.Scan(&m.ID, &m.StreamID, &m.UserID, &m.Username, &m.DisplayName,
			&m.Body, &m.IsHighlighted, &m.TipAmount, &m.SentAt); err != nil {
			return nil, 0, err
		}
		messages = append(messages, m)
	}
	return messages, total, nil
}

// DeleteMessage removes a specific message by ID.
func (r *ChatRepository) DeleteMessage(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM chat_messages WHERE id = $1`, id)
	return err
}

// BanUser adds a chat ban record for a user (duration in seconds, 0 = permanent).
func (r *ChatRepository) BanUser(ctx context.Context, userID string, durationSeconds int) error {
	expiresAt := time.Now().Add(time.Duration(durationSeconds) * time.Second)
	_, err := r.pool.Exec(ctx,
		`INSERT INTO chat_bans (user_id, expires_at, created_at) VALUES ($1, $2, NOW())
		 ON CONFLICT (user_id) DO UPDATE SET expires_at = $2, created_at = NOW()`,
		userID, expiresAt)
	return err
}

// PurgeStreamMessages deletes all messages for a given stream.
func (r *ChatRepository) PurgeStreamMessages(ctx context.Context, streamID string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM chat_messages WHERE stream_id = $1`, streamID)
	return err
}