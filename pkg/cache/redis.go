package cache

import (
	"context"
	"time"

	"github.com/redis/go-redis/v9"
)

// RedisCache implements Cache using Redis.
type RedisCache struct {
	client *redis.Client
	prefix string
}

// NewRedisCache creates a new Redis-backed cache.
// prefix is optional — if set, all keys are prefixed with it.
func NewRedisCache(client *redis.Client, prefix string) *RedisCache {
	return &RedisCache{client: client, prefix: prefix}
}

func (r *RedisCache) prefixed(key string) string {
	if r.prefix == "" {
		return key
	}
	return r.prefix + ":" + key
}

func (r *RedisCache) Get(ctx context.Context, key string) ([]byte, error) {
	data, err := r.client.Get(ctx, r.prefixed(key)).Bytes()
	if err == redis.Nil {
		return nil, nil
	}
	return data, err
}

func (r *RedisCache) Set(ctx context.Context, key string, value []byte, ttl time.Duration) error {
	return r.client.Set(ctx, r.prefixed(key), value, ttl).Err()
}

func (r *RedisCache) Delete(ctx context.Context, key string) error {
	return r.client.Del(ctx, r.prefixed(key)).Err()
}

func (r *RedisCache) Exists(ctx context.Context, key string) (bool, error) {
	n, err := r.client.Exists(ctx, r.prefixed(key)).Result()
	return n > 0, err
}

func (r *RedisCache) Increment(ctx context.Context, key string) (int64, error) {
	return r.client.Incr(ctx, r.prefixed(key)).Result()
}

func (r *RedisCache) Expire(ctx context.Context, key string, ttl time.Duration) error {
	return r.client.Expire(ctx, r.prefixed(key), ttl).Err()
}

func (r *RedisCache) TTL(ctx context.Context, key string) (time.Duration, error) {
	return r.client.TTL(ctx, r.prefixed(key)).Result()
}

func (r *RedisCache) Publish(ctx context.Context, channel string, message []byte) error {
	return r.client.Publish(ctx, r.prefixed(channel), message).Err()
}

func (r *RedisCache) Subscribe(ctx context.Context, channels ...string) (PubSub, error) {
	prefixed := make([]string, len(channels))
	for i, ch := range channels {
		prefixed[i] = r.prefixed(ch)
	}
	pubsub := r.client.Subscribe(ctx, prefixed...)
	return &redisPubSub{pubsub: pubsub, prefix: r.prefix}, nil
}

func (r *RedisCache) Close() error {
	return r.client.Close()
}

type redisPubSub struct {
	pubsub *redis.PubSub
	prefix string
}

func (p *redisPubSub) Channel() <-chan PubSubMessage {
	ch := make(chan PubSubMessage)
	go func() {
		for msg := range p.pubsub.Channel() {
			ch <- PubSubMessage{
				Channel: msg.Channel,
				Payload: []byte(msg.Payload),
			}
		}
	}()
	return ch
}

func (p *redisPubSub) Close() error {
	return p.pubsub.Close()
}

// JSON helper — required in this file for the RedisCache version.
// The interface file already defines the JSONCodec struct.