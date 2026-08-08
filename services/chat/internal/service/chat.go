package service

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
	"github.com/google/uuid"
	"github.com/bedrivetech/wiitoo/services/chat/internal/config"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool { return true },
}

type ChatMessage struct {
	ID            string    `json:"id"`
	StreamID      string    `json:"streamId"`
	UserID        string    `json:"userId"`
	Username      string    `json:"username"`
	DisplayName   string    `json:"displayName"`
	Body          string    `json:"body"`
	IsHighlighted bool      `json:"isHighlighted,omitempty"`
	TipAmount     float64   `json:"tipAmount,omitempty"`
	Badges        []string  `json:"badges,omitempty"`
	SentAt        time.Time `json:"sentAt"`
}

type ChatService struct {
	rdb        *redis.Client
	pool       *pgxpool.Pool
	cfg        *svcconfig.Config
	clients    map[string]map[string]*websocket.Conn // streamID -> userID -> conn
	mu         sync.RWMutex
}

func NewChatService(redisURL string, pool *pgxpool.Pool, cfg *svcconfig.Config) *ChatService {
	opts, _ := redis.ParseURL(redisURL)
	rdb := redis.NewClient(opts)

	return &ChatService{
		rdb:     rdb,
		pool:    pool,
		cfg:     cfg,
		clients: make(map[string]map[string]*websocket.Conn),
	}
}

func (s *ChatService) HandleWebSocket(w http.ResponseWriter, r *http.Request, streamID string) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		slog.Error("websocket upgrade failed", "error", err)
		return
	}

	userID := r.URL.Query().Get("user_id")
	username := r.URL.Query().Get("username")
	if userID == "" || username == "" {
		conn.WriteJSON(map[string]string{"error": "user_id and username required"})
		conn.Close()
		return
	}

	s.mu.Lock()
	if _, ok := s.clients[streamID]; !ok {
		s.clients[streamID] = make(map[string]*websocket.Conn)
	}
	s.clients[streamID][userID] = conn
	s.mu.Unlock()

	slog.Info("websocket connected", "stream", streamID, "user", username)

	go func() {
		defer func() {
			s.mu.Lock()
			delete(s.clients[streamID], userID)
			if len(s.clients[streamID]) == 0 {
				delete(s.clients, streamID)
			}
			s.mu.Unlock()
			conn.Close()
		}()

		// Subscribe to Redis pub/sub for this stream's chat
		pubsub := s.rdb.Subscribe(r.Context(), fmt.Sprintf("stream:%s:chat", streamID))
		defer pubsub.Close()

		// Channel to forward Redis messages to WebSocket
		go func() {
			for msg := range pubsub.Channel() {
				if err := conn.WriteMessage(websocket.TextMessage, []byte(msg.Payload)); err != nil {
					return
				}
			}
		}()

		// Read incoming messages from the WebSocket
		for {
			_, message, err := conn.ReadMessage()
			if err != nil {
				break
			}

			var msg struct {
				Body string `json:"body"`
			}
			if err := json.Unmarshal(message, &msg); err != nil {
				continue
			}

			chatMsg := ChatMessage{
				ID:          uuid.New().String(),
				StreamID:    streamID,
				UserID:      userID,
				Username:    username,
				DisplayName: username,
				Body:        msg.Body,
				SentAt:      time.Now(),
			}

			s.Broadcast(r.Context(), streamID, chatMsg)
			s.SaveMessage(r.Context(), chatMsg)
		}
	}()
}

func (s *ChatService) Broadcast(ctx context.Context, streamID string, msg ChatMessage) {
	data, _ := json.Marshal(msg)
	s.rdb.Publish(ctx, fmt.Sprintf("stream:%s:chat", streamID), data)
}

func (s *ChatService) SaveMessage(ctx context.Context, msg ChatMessage) {
	_, err := s.pool.Exec(ctx,
		`INSERT INTO chat_messages (id, stream_id, user_id, username, display_name, body, sent_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
		msg.ID, msg.StreamID, msg.UserID, msg.Username, msg.DisplayName, msg.Body, msg.SentAt)
	if err != nil {
		slog.Error("failed to save chat message", "error", err)
	}
}

func (s *ChatService) GetHistory(ctx context.Context, streamID string, limit, offset int) ([]ChatMessage, error) {
	rows, err := s.pool.Query(ctx,
		`SELECT id, stream_id, user_id, username, display_name, body, is_highlighted, tip_amount, badges, sent_at
		 FROM chat_messages WHERE stream_id = $1 ORDER BY sent_at DESC LIMIT $2 OFFSET $3`,
		streamID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []ChatMessage
	for rows.Next() {
		var msg ChatMessage
		rows.Scan(&msg.ID, &msg.StreamID, &msg.UserID, &msg.Username, &msg.DisplayName,
			&msg.Body, &msg.IsHighlighted, &msg.TipAmount, &msg.Badges, &msg.SentAt)
		messages = append(messages, msg)
	}
	return messages, nil
}

func (s *ChatService) SendMessage(ctx context.Context, streamID, userID, username, body string) (*ChatMessage, error) {
	msg := ChatMessage{
		ID:          uuid.New().String(),
		StreamID:    streamID,
		UserID:      userID,
		Username:    username,
		DisplayName: username,
		Body:        body,
		SentAt:      time.Now(),
	}
	s.Broadcast(ctx, streamID, msg)
	s.SaveMessage(ctx, msg)
	return &msg, nil
}

func (s *ChatService) Timeout(ctx context.Context, streamID, userID string, duration time.Duration) error {
	key := fmt.Sprintf("chat:timeout:%s:%s", streamID, userID)
	return s.rdb.Set(ctx, key, "1", duration).Err()
}

func (s *ChatService) Ban(ctx context.Context, streamID, userID string) error {
	key := fmt.Sprintf("chat:ban:%s:%s", streamID, userID)
	return s.rdb.Set(ctx, key, "1", 0).Err()
}

func (s *ChatService) GetViewerCount(streamID string) int {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return len(s.clients[streamID])
}
