package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/fusion-platform/pkg/stream"
	"github.com/fusion-platform/stream/internal/config"
)

type StreamService struct {
	cfg  *svcconfig.Config
	pool *pgxpool.Pool
}

func NewStreamService(cfg *svcconfig.Config, pool *pgxpool.Pool) *StreamService {
	return &StreamService{cfg: cfg, pool: pool}
}

func (s *StreamService) StartStream(ctx context.Context, userID, title, category string, isMature bool, tags []string) (*stream.Stream, error) {
	streamKey, err := generateStreamKey()
	if err != nil {
		return nil, fmt.Errorf("failed to generate stream key: %w", err)
	}

	now := time.Now()
	st := &stream.Stream{
		ID:          uuid.New().String(),
		UserID:      userID,
		Title:       title,
		Category:    category,
		Tags:        tags,
		StreamKey:   streamKey,
		RTMPURL:     fmt.Sprintf("rtmp://%s/live", s.cfg.RTMPListenAddr),
		Status:      stream.StreamStatusStarting,
		IsMature:    isMature,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	_, err = s.pool.Exec(ctx,
		`INSERT INTO streams (id, user_id, title, category, tags, stream_key, rtmp_url, status, is_mature, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
		st.ID, st.UserID, st.Title, st.Category, st.Tags, st.StreamKey, st.RTMPURL,
		string(st.Status), st.IsMature, st.CreatedAt, st.UpdatedAt)

	return st, err
}

func (s *StreamService) EndStream(ctx context.Context, id string) error {
	now := time.Now()
	_, err := s.pool.Exec(ctx,
		`UPDATE streams SET status='ended', ended_at=$1, updated_at=$1 WHERE id=$2 AND status='live'`,
		now, id)
	return err
}

func (s *StreamService) GetStream(ctx context.Context, id string) (*stream.Stream, error) {
	st := &stream.Stream{}
	var statusStr string
	err := s.pool.QueryRow(ctx,
		`SELECT id, user_id, title, category, tags, rtmp_url, status, viewer_count, max_viewers, started_at, ended_at, duration, vod_key, is_mature, created_at, updated_at
		 FROM streams WHERE id = $1`, id).Scan(
		&st.ID, &st.UserID, &st.Title, &st.Category, &st.Tags, &st.RTMPURL,
		&statusStr, &st.ViewerCount, &st.MaxViewers, &st.StartedAt, &st.EndedAt,
		&st.Duration, &st.VODKey, &st.IsMature, &st.CreatedAt, &st.UpdatedAt)
	st.Status = stream.StreamStatus(statusStr)
	return st, err
}

func (s *StreamService) ListLiveStreams(ctx context.Context, category string, limit, offset int) ([]*stream.Stream, error) {
	var rows pgx.Rows
	var err error

	if category != "" {
		rows, err = s.pool.Query(ctx,
			`SELECT id, user_id, title, category, tags, rtmp_url, status, viewer_count, max_viewers, started_at, is_mature, created_at
			 FROM streams WHERE status='live' AND category=$1 ORDER BY viewer_count DESC LIMIT $2 OFFSET $3`,
			category, limit, offset)
	} else {
		rows, err = s.pool.Query(ctx,
			`SELECT id, user_id, title, category, tags, rtmp_url, status, viewer_count, max_viewers, started_at, is_mature, created_at
			 FROM streams WHERE status='live' ORDER BY viewer_count DESC LIMIT $1 OFFSET $2`,
			limit, offset)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []*stream.Stream
	for rows.Next() {
		var st stream.Stream
		var statusStr string
		if err := rows.Scan(&st.ID, &st.UserID, &st.Title, &st.Category, &st.Tags, &st.RTMPURL,
			&statusStr, &st.ViewerCount, &st.MaxViewers, &st.StartedAt, &st.IsMature, &st.CreatedAt); err != nil {
			return nil, err
		}
		st.Status = stream.StreamStatus(statusStr)
		results = append(results, &st)
	}
	return results, nil
}

func (s *StreamService) GetAnalytics(ctx context.Context, streamID string) (*stream.AnalyticsSnapshot, error) {
	a := &stream.AnalyticsSnapshot{}
	err := s.pool.QueryRow(ctx,
		`SELECT stream_id, viewer_count, new_followers, new_subscribers, bits_donated
		 FROM stream_analytics WHERE stream_id = $1 ORDER BY timestamp DESC LIMIT 1`,
		streamID).Scan(&a.StreamID, &a.ViewerCount, &a.NewFollowers, &a.NewSubscribers, &a.BitsDonated)
	return a, err
}

func (s *StreamService) ListCategories(ctx context.Context) ([]stream.Category, error) {
	rows, err := s.pool.Query(ctx,
		`SELECT id, name, slug, description, thumbnail FROM categories ORDER BY viewer_count DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var cats []stream.Category
	for rows.Next() {
		var c stream.Category
		rows.Scan(&c.ID, &c.Name, &c.Slug, &c.Description, &c.Thumbnail)
		cats = append(cats, c)
	}
	return cats, nil
}

func (s *StreamService) GetIngestServers() []stream.IngestServer {
	return []stream.IngestServer{
		{ID: "us-east", Name: "US East", Hostname: "ingest-us-east.fusion.stream", Port: 1935, Region: "us-east", Priority: 1},
		{ID: "eu-west", Name: "EU West", Hostname: "ingest-eu-west.fusion.stream", Port: 1935, Region: "eu-west", Priority: 2},
		{ID: "ap-southeast", Name: "Asia Pacific", Hostname: "ingest-ap-southeast.fusion.stream", Port: 1935, Region: "ap-southeast", Priority: 3},
	}
}

func (s *StreamService) UpdateSimulcast(ctx context.Context, streamID string, targets []stream.SimulcastTarget) error {
	for _, t := range targets {
		_, err := s.pool.Exec(ctx,
			`INSERT INTO simulcast_targets (stream_id, platform, rtmp_url, stream_key, enabled)
			 VALUES ($1, $2, $3, pgp_sym_encrypt($4, 'fusion-key'), $5)
			 ON CONFLICT (stream_id, platform) DO UPDATE SET rtmp_url=$3, stream_key=pgp_sym_encrypt($4, 'fusion-key'), enabled=$5`,
			streamID, t.Platform, t.RTMPURL, t.StreamKey, t.Enabled)
		if err != nil {
			return err
		}
	}
	return nil
}

func (s *StreamService) GetSimulcastConfig(ctx context.Context, streamID string) ([]stream.SimulcastTarget, error) {
	rows, err := s.pool.Query(ctx,
		`SELECT platform, rtmp_url, pgp_sym_decrypt(stream_key, 'fusion-key'), enabled
		 FROM simulcast_targets WHERE stream_id = $1`, streamID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var targets []stream.SimulcastTarget
	for rows.Next() {
		var t stream.SimulcastTarget
		rows.Scan(&t.Platform, &t.RTMPURL, &t.StreamKey, &t.Enabled)
		targets = append(targets, t)
	}
	return targets, nil
}

func (s *StreamService) HandleMediaMTXWebhook(ctx context.Context, event map[string]any) {
	if eventType, ok := event["event"].(string); ok {
		switch eventType {
		case "connect":
			slog.Info("RTMP client connected", "remote_addr", event["remote_addr"])
		case "disconnect":
			slog.Info("RTMP client disconnected")
		case "publish":
			if streamKey, ok := event["key"].(string); ok {
				_, err := s.pool.Exec(ctx,
					`UPDATE streams SET status='live', started_at=NOW(), updated_at=NOW() WHERE stream_key=$1`,
					streamKey)
				if err != nil {
					slog.Error("failed to update stream status on publish", "error", err)
				}
			}
		case "publish_done":
			if streamKey, ok := event["key"].(string); ok {
				_, err := s.pool.Exec(ctx,
					`UPDATE streams SET status='ended', ended_at=NOW(), duration=EXTRACT(EPOCH FROM NOW() - started_at)::int, updated_at=NOW() WHERE stream_key=$1 AND status='live'`,
					streamKey)
				if err != nil {
					slog.Error("failed to update stream status on publish_done", "error", err)
				}
			}
		}
	}
}

func generateStreamKey() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}
