package queue

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"time"

	"github.com/hibiken/asynq"
)

// AsynqQueue implements TaskQueue using the Asynq library.
type AsynqQueue struct {
	client    *asynq.Client
	server    *asynq.Server
	mux       *asynq.ServeMux
	handlers  map[string]TaskHandler
}

// AsynqConfig holds configuration for the Asynq queue.
type AsynqConfig struct {
	RedisURL    string
	Concurrency int
	QueueName   string
}

// NewAsynqQueue creates a new Asynq-backed task queue.
func NewAsynqQueue(cfg AsynqConfig) (*AsynqQueue, error) {
	redisOpt, err := asynq.ParseRedisURI(cfg.RedisURL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse Redis URL for asynq: %w", err)
	}

	client := asynq.NewClient(redisOpt)

	server := asynq.NewServer(
		redisOpt,
		asynq.Config{
			Concurrency: cfg.Concurrency,
			Queues: map[string]int{
				"critical": 6,
				"default":  3,
				"low":      1,
			},
			Logger: asynqLogger{},
		},
	)

	mux := asynq.NewServeMux()

	return &AsynqQueue{
		client:   client,
		server:   server,
		mux:      mux,
		handlers: make(map[string]TaskHandler),
	}, nil
}

func (a *AsynqQueue) Enqueue(ctx context.Context, task Task) error {
	return a.enqueue(ctx, task, "")
}

func (a *AsynqQueue) EnqueueWithKey(ctx context.Context, task Task, dedupKey string) error {
	return a.enqueue(ctx, task, dedupKey)
}

func (a *AsynqQueue) enqueue(ctx context.Context, task Task, dedupKey string) error {
	payload, err := json.Marshal(task.Payload)
	if err != nil {
		return fmt.Errorf("failed to marshal task payload: %w", err)
	}

	asynqTask := asynq.NewTask(task.Type, payload)

	var opts []asynq.Option
	if task.MaxRetries > 0 {
		opts = append(opts, asynq.MaxRetry(task.MaxRetries))
	} else {
		opts = append(opts, asynq.MaxRetry(5))
	}
	if task.Delay > 0 {
		opts = append(opts, asynq.ProcessIn(task.Delay))
	}
	if task.Timeout > 0 {
		opts = append(opts, asynq.Timeout(task.Timeout))
	}
	switch {
	case task.Priority >= 10:
		opts = append(opts, asynq.Queue("critical"))
	case task.Priority >= 5:
		opts = append(opts, asynq.Queue("default"))
	case task.Priority >= 0:
		opts = append(opts, asynq.Queue("low"))
	}
	if dedupKey != "" {
		opts = append(opts, asynq.Unique(24*time.Hour))
	}

	_, err = a.client.Enqueue(asynqTask, opts...)
	if err != nil {
		return fmt.Errorf("failed to enqueue task: %w", err)
	}
	return nil
}

func (a *AsynqQueue) RegisterHandler(taskType string, handler TaskHandler) error {
	a.handlers[taskType] = handler
	a.mux.HandleFunc(taskType, func(ctx context.Context, t *asynq.Task) error {
		task := Task{
			Type:    t.Type(),
			Payload: t.Payload(),
		}
		return handler(ctx, task)
	})
	return nil
}

func (a *AsynqQueue) Start(ctx context.Context) error {
	slog.Info("task queue processor starting",
		"handlers", len(a.handlers),
	)

	if err := a.server.Start(a.mux); err != nil {
		return fmt.Errorf("asynq server failed: %w", err)
	}

	// Wait for context cancellation
	<-ctx.Done()
	return nil
}

func (a *AsynqQueue) Stop(ctx context.Context) error {
	a.server.Shutdown()
	a.client.Close()
	return nil
}

// asynqLogger adapts slog to asynq's logger interface.
type asynqLogger struct{}

func (l asynqLogger) Debug(args ...any) { slog.Debug(fmt.Sprint(args...)) }
func (l asynqLogger) Info(args ...any)  { slog.Info(fmt.Sprint(args...)) }
func (l asynqLogger) Warn(args ...any)  { slog.Warn(fmt.Sprint(args...)) }
func (l asynqLogger) Error(args ...any) { slog.Error(fmt.Sprint(args...)) }
func (l asynqLogger) Fatal(args ...any) { slog.Error(fmt.Sprint(args...)) }