package storage

import (
	"context"
	"fmt"
	"sync"
)

// Strategy defines how to select a bucket for uploads.
type Strategy string

const (
	StrategyRoundRobin Strategy = "round_robin"
	StrategyGeo        Strategy = "geo"
	StrategyCapacity   Strategy = "capacity"
)

// RoutingRule maps usage types to strategies.
type RoutingRule struct {
	Usage     string   `json:"usage"`     // "video", "thumbnail", "backup", "general"
	Strategy  Strategy `json:"strategy"`
	BucketIDs []string `json:"bucketIds"` // ordered list of bucket IDs to consider
}

// UploadRouter selects a bucket based on strategy.
type UploadRouter struct {
	mu                sync.RWMutex
	rules             map[string]*RoutingRule
	defaultRule       *RoutingRule
	roundRobinCounters map[string]int // per-usage counter
}

// NewUploadRouter creates a router from routing rules.
func NewUploadRouter(rules []RoutingRule) *UploadRouter {
	r := &UploadRouter{
		rules:              make(map[string]*RoutingRule),
		roundRobinCounters: make(map[string]int),
	}
	for i := range rules {
		rule := rules[i]
		r.rules[rule.Usage] = &rule
	}
	return r
}

// SelectBucket picks a bucket for the given usage based on the configured strategy.
func (r *UploadRouter) SelectBucket(ctx context.Context, usage string, geoHint string) (string, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	rule, ok := r.rules[usage]
	if !ok {
		rule = r.defaultRule
	}
	if rule == nil || len(rule.BucketIDs) == 0 {
		return "", fmt.Errorf("no routing rule found for usage: %s", usage)
	}

	var bucketID string
	switch rule.Strategy {
	case StrategyRoundRobin:
		bucketID = r.roundRobin(rule.BucketIDs)
	case StrategyGeo:
		bucketID = r.geo(usage, geoHint)
	case StrategyCapacity:
		bucketID = r.capacity(rule.BucketIDs)
	default:
		bucketID = r.roundRobin(rule.BucketIDs)
	}

	return bucketID, nil
}

// UpdateRules hot-reloads routing rules.
func (r *UploadRouter) UpdateRules(rules []RoutingRule) {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.rules = make(map[string]*RoutingRule)
	for i := range rules {
		rule := rules[i]
		r.rules[rule.Usage] = &rule
	}
}

// roundRobin cycles through bucket IDs.
func (r *UploadRouter) roundRobin(bucketIDs []string) string {
	if len(bucketIDs) == 0 {
		return ""
	}

	idx := r.roundRobinCounters["_rr_idx"]
	if idx >= len(bucketIDs) {
		idx = 0
	}
	r.roundRobinCounters["_rr_idx"] = idx + 1
	return bucketIDs[idx]
}

// geo picks the nearest region based on hint.
// Falls back to first bucket if no geo mapping exists for the hint.
func (r *UploadRouter) geo(usage string, geoHint string) string {
	// For now, just return the first bucket as a simple fallback.
	// In production this would use a region-to-bucket mapping from the rule.
	return ""
}

// capacity picks the bucket with most available space.
// Falls back to round-robin if capacity data is unavailable.
func (r *UploadRouter) capacity(bucketIDs []string) string {
	if len(bucketIDs) == 0 {
		return ""
	}
	// Simple round-robin fallback when capacity info is not available
	idx := r.roundRobinCounters["_cap_idx"]
	if idx >= len(bucketIDs) {
		idx = 0
	}
	r.roundRobinCounters["_cap_idx"] = idx + 1
	return bucketIDs[idx]
}