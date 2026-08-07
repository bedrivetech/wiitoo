package service

import (
	"context"
	"fmt"

	"github.com/fusion-platform/storage/internal/model"
	"github.com/fusion-platform/storage/internal/repository"
)

// RoutingService handles CRUD operations for upload routing rules.
type RoutingService struct {
	repo *repository.StorageRepository
}

// NewRoutingService creates a new RoutingService.
func NewRoutingService(repo *repository.StorageRepository) *RoutingService {
	return &RoutingService{repo: repo}
}

// ListRules returns all routing rules.
func (s *RoutingService) ListRules(ctx context.Context) ([]model.RoutingRule, error) {
	return s.repo.ListRoutingRules(ctx)
}

// GetRule returns a routing rule by usage type.
func (s *RoutingService) GetRule(ctx context.Context, usage string) (*model.RoutingRule, error) {
	return s.repo.GetRoutingRule(ctx, usage)
}

// CreateRule creates a new routing rule.
func (s *RoutingService) CreateRule(ctx context.Context, req model.CreateRoutingRuleRequest) (*model.RoutingRule, error) {
	if req.Usage == "" {
		return nil, fmt.Errorf("usage type is required")
	}

	// Validate strategy
	validStrategies := map[string]bool{"round_robin": true, "geo": true, "capacity": true}
	if req.Strategy != "" && !validStrategies[req.Strategy] {
		return nil, fmt.Errorf("invalid strategy: %s", req.Strategy)
	}

	// Check for duplicate
	existing, err := s.repo.GetRoutingRule(ctx, req.Usage)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return nil, fmt.Errorf("routing rule already exists for usage: %s", req.Usage)
	}

	return s.repo.CreateRoutingRule(ctx, req)
}

// UpdateRule updates a routing rule for a usage type.
func (s *RoutingService) UpdateRule(ctx context.Context, usage string, req model.UpdateRoutingRuleRequest) (*model.RoutingRule, error) {
	if req.Strategy != nil {
		validStrategies := map[string]bool{"round_robin": true, "geo": true, "capacity": true}
		if !validStrategies[*req.Strategy] {
			return nil, fmt.Errorf("invalid strategy: %s", *req.Strategy)
		}
	}

	rule, err := s.repo.UpdateRoutingRule(ctx, usage, req)
	if err != nil {
		return nil, err
	}
	if rule == nil {
		return nil, fmt.Errorf("routing rule not found for usage: %s", usage)
	}

	return rule, nil
}

// DeleteRule deletes a routing rule.
func (s *RoutingService) DeleteRule(ctx context.Context, usage string) error {
	return s.repo.DeleteRoutingRule(ctx, usage)
}