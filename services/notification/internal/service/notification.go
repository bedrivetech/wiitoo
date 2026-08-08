package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/bedrivetech/wiitoo/services/notification/internal/config"
)

type Notification struct {
	ID        string    `json:"id"`
	UserID    string    `json:"userId"`
	Type      string    `json:"type"` // new_follower, stream_started, tip_received, payout_processed, sub_gifted
	Title     string    `json:"title"`
	Body      string    `json:"body"`
	Data      map[string]string `json:"data,omitempty"`
	Read      bool      `json:"read"`
	CreatedAt time.Time `json:"createdAt"`
}

type NotificationPreferences struct {
	UserID            string `json:"userId"`
	EmailFollows      bool   `json:"emailFollows"`
	EmailSubs         bool   `json:"emailSubs"`
	EmailTips         bool   `json:"emailTips"`
	EmailPayouts      bool   `json:"emailPayouts"`
	PushFollows       bool   `json:"pushFollows"`
	PushSubs          bool   `json:"pushSubs"`
	PushTips          bool   `json:"pushTips"`
	PushStreamStarts  bool   `json:"pushStreamStarts"`
}

type NotificationService struct {
	pool *pgxpool.Pool
	cfg  *svcconfig.Config
}

func NewNotificationService(pool *pgxpool.Pool, cfg *svcconfig.Config) *NotificationService {
	return &NotificationService{pool: pool, cfg: cfg}
}

func (s *NotificationService) SendNotification(ctx context.Context, userID, notifType, title, body string, data map[string]string) (*Notification, error) {
	n := &Notification{
		ID:        uuid.New().String(),
		UserID:    userID,
		Type:      notifType,
		Title:     title,
		Body:      body,
		Data:      data,
		Read:      false,
		CreatedAt: time.Now(),
	}

	_, err := s.pool.Exec(ctx,
		`INSERT INTO notifications (id, user_id, type, title, body, data, read, created_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
		n.ID, n.UserID, n.Type, n.Title, n.Body, n.Data, n.Read, n.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to save notification: %w", err)
	}

	return n, nil
}

func (s *NotificationService) ListNotifications(ctx context.Context, userID string, limit, offset int) ([]Notification, error) {
	rows, err := s.pool.Query(ctx,
		`SELECT id, user_id, type, title, body, data, read, created_at
		 FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
		userID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var notifications []Notification
	for rows.Next() {
		var n Notification
		rows.Scan(&n.ID, &n.UserID, &n.Type, &n.Title, &n.Body, &n.Data, &n.Read, &n.CreatedAt)
		notifications = append(notifications, n)
	}
	return notifications, nil
}

func (s *NotificationService) MarkRead(ctx context.Context, userID, notificationID string) error {
	_, err := s.pool.Exec(ctx,
		`UPDATE notifications SET read=true WHERE id=$1 AND user_id=$2`,
		notificationID, userID)
	return err
}

func (s *NotificationService) MarkAllRead(ctx context.Context, userID string) error {
	_, err := s.pool.Exec(ctx,
		`UPDATE notifications SET read=true WHERE user_id=$1 AND read=false`, userID)
	return err
}

func (s *NotificationService) UnreadCount(ctx context.Context, userID string) (int, error) {
	var count int
	err := s.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM notifications WHERE user_id=$1 AND read=false`, userID).Scan(&count)
	return count, err
}

func (s *NotificationService) GetPreferences(ctx context.Context, userID string) (*NotificationPreferences, error) {
	p := &NotificationPreferences{UserID: userID}
	err := s.pool.QueryRow(ctx,
		`SELECT email_follows, email_subs, email_tips, email_payouts, push_follows, push_subs, push_tips, push_stream_starts
		 FROM notification_preferences WHERE user_id = $1`, userID).Scan(
		&p.EmailFollows, &p.EmailSubs, &p.EmailTips, &p.EmailPayouts,
		&p.PushFollows, &p.PushSubs, &p.PushTips, &p.PushStreamStarts)
	if err != nil {
		return &NotificationPreferences{UserID: userID, EmailFollows: true, EmailSubs: true, EmailTips: true, EmailPayouts: true,
			PushFollows: true, PushSubs: true, PushTips: true, PushStreamStarts: true}, nil
	}
	return p, nil
}

func (s *NotificationService) UpdatePreferences(ctx context.Context, prefs *NotificationPreferences) error {
	_, err := s.pool.Exec(ctx,
		`INSERT INTO notification_preferences (user_id, email_follows, email_subs, email_tips, email_payouts,
		 push_follows, push_subs, push_tips, push_stream_starts)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
		 ON CONFLICT (user_id) DO UPDATE SET
		 email_follows=$2, email_subs=$3, email_tips=$4, email_payouts=$5,
		 push_follows=$6, push_subs=$7, push_tips=$8, push_stream_starts=$9`,
		prefs.UserID, prefs.EmailFollows, prefs.EmailSubs, prefs.EmailTips, prefs.EmailPayouts,
		prefs.PushFollows, prefs.PushSubs, prefs.PushTips, prefs.PushStreamStarts)
	return err
}
