// Package cache provides a provider-agnostic cache interface.
// Default implementation: Redis.
package cache

import (
	"context"
	"encoding/json"
	"time"
)

// Cache is the interface for all caching operations.
type Cache interface {
	// Get retrieves a value by key. Returns nil if key doesn't exist.
	Get(ctx context.Context, key string) ([]byte, error)

	// Set stores a value with the given TTL.
	Set(ctx context.Context, key string, value []byte, ttl time.Duration) error

	// Delete removes a key.
	Delete(ctx context.Context, key string) error

	// Exists checks if a key exists.
	Exists(ctx context.Context, key string) (bool, error)

	// Increment atomically increments a key and returns the new value.
	Increment(ctx context.Context, key string) (int64, error)

	// Expire sets a TTL on an existing key.
	Expire(ctx context.Context, key string, ttl time.Duration) error

	// TTL returns the remaining TTL of a key.
	TTL(ctx context.Context, key string) (time.Duration, error)

	// Publish publishes a message to a channel.
	Publish(ctx context.Context, channel string, message []byte) error

	// Subscribe subscribes to one or more channels.
	Subscribe(ctx context.Context, channels ...string) (PubSub, error)

	// Close cleans up the cache connection.
	Close() error
}

// PubSub is a subscription to one or more channels.
type PubSub interface {
	// Channel returns a channel for receiving messages.
	Channel() <-chan PubSubMessage

	// Close unsubscribes and cleans up.
	Close() error
}

// PubSubMessage represents a message received on a pub/sub channel.
type PubSubMessage struct {
	Channel string
	Payload []byte
}

// StringValue is a helper to get a string value from the cache.
func GetString(ctx context.Context, c Cache, key string) (string, error) {
	data, err := c.Get(ctx, key)
	if err != nil {
		return "", err
	}
	if data == nil {
		return "", nil
	}
	return string(data), nil
}

// SetString stores a string value.
func SetString(ctx context.Context, c Cache, key, value string, ttl time.Duration) error {
	return c.Set(ctx, key, []byte(value), ttl)
}

// JSONCodec is a helper for marshaling/unmarshaling JSON to/from the cache.
type JSONCodec struct {
	Cache Cache
}

// GetJSON retrieves and unmarshals a JSON value.
func (j *JSONCodec) GetJSON(ctx context.Context, key string, target any) error {
	data, err := j.Cache.Get(ctx, key)
	if err != nil || data == nil {
		return err
	}
	return json.Unmarshal(data, target)
}

// SetJSON marshals and stores a JSON value.
func (j *JSONCodec) SetJSON(ctx context.Context, key string, value any, ttl time.Duration) error {
	data, err := json.Marshal(value)
	if err != nil {
		return err
	}
	return j.Cache.Set(ctx, key, data, ttl)
}