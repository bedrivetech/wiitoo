// Package queue provides a provider-agnostic task queue interface.
// Default implementation: Asynq (Redis-backed).
package queue

import (
	"context"
	"encoding/json"
	"time"
)

// Task represents a unit of work to be processed asynchronously.
type Task struct {
	// Type identifies the kind of task (e.g., "transcode:video", "email:send").
	Type string `json:"type"`

	// Payload is the task-specific data (JSON-encodable).
	Payload any `json:"payload"`

	// MaxRetries is the maximum number of retry attempts. Default: 5.
	MaxRetries int `json:"maxRetries,omitempty"`

	// Delay before the task becomes available for processing.
	Delay time.Duration `json:"delay,omitempty"`

	// Timeout for processing this task.
	Timeout time.Duration `json:"timeout,omitempty"`

	// Priority (higher = more important).
	Priority int `json:"priority,omitempty"`
}

// TaskQueue is the interface for enqueuing and processing background tasks.
type TaskQueue interface {
	// Enqueue adds a task to the queue.
	Enqueue(ctx context.Context, task Task) error

	// EnqueueWithKey adds a task with a deduplication key (only one pending task per key).
	EnqueueWithKey(ctx context.Context, task Task, dedupKey string) error

	// RegisterHandler registers a handler for a specific task type.
	RegisterHandler(taskType string, handler TaskHandler) error

	// Start begins processing tasks from the queue. Blocks until shutdown.
	Start(ctx context.Context) error

	// Stop gracefully stops the queue processor.
	Stop(ctx context.Context) error
}

// TaskHandler processes a single task and returns an error if processing fails.
type TaskHandler func(ctx context.Context, task Task) error

// Standard task types used across the platform.
const (
	TaskTypeVideoProcess    = "video:process"     // Cloud pipeline processing complete
	TaskTypeEmailSend       = "email:send"
	TaskTypeNotifySubscriber = "notify:subscriber"
	TaskTypePayoutProcess   = "payout:process"
	TaskTypeSimulcastPush   = "simulcast:push"
	TaskTypeModerationScan  = "moderation:scan"
	TaskTypeAnalyticsProcess = "analytics:process"
)

// Payload types (JSON-encodable structs for each task type).

// TranscodePayload is sent when a video needs transcoding.
type TranscodePayload struct {
	StreamID    string `json:"streamId"`
	UserID      string `json:"userId"`
	InputKey    string `json:"inputKey"`
	OutputKey   string `json:"outputKey"`
	Format      string `json:"format"` // "hls", "mp4", "clip"
	Resolutions []string `json:"resolutions,omitempty"` // ["720p", "1080p", "source"]
}

// EmailPayload is sent when an email needs to be dispatched.
type EmailPayload struct {
	To       string `json:"to"`
	Subject  string `json:"subject"`
	TextBody string `json:"textBody"`
	HTMLBody string `json:"htmlBody"`
	Metadata map[string]string `json:"metadata,omitempty"`
}

// PayoutPayload is sent when a creator payout needs processing.
type PayoutPayload struct {
	CreatorID    string  `json:"creatorId"`
	Amount       float64 `json:"amount"`
	Currency     string  `json:"currency"`
	PayoutMethod string  `json:"payoutMethod"` // "paypal", "usdc", "bank"
	PayoutRef    string  `json:"payoutRef"`
}

// SimulcastPayload is sent when pushing a stream to external platforms.
type SimulcastPayload struct {
	StreamID      string   `json:"streamId"`
	Destinations  []string `json:"destinations"` // ["youtube", "twitch", "kick", "rumble"]
	StreamKeyMap  map[string]string `json:"streamKeyMap"`
	RTMPURL       string   `json:"rtmpUrl"`
}

// JSON helpers
func MarshalPayload(v any) ([]byte, error)     { return json.Marshal(v) }
func UnmarshalPayload(data []byte, v any) error { return json.Unmarshal(data, v) }