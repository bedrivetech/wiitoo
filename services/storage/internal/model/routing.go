package model

import "time"

// RoutingRule represents an upload routing rule stored in the database.
type RoutingRule struct {
	ID        string            `json:"id"`
	Usage     string            `json:"usage"`
	Strategy  string            `json:"strategy"` // "round_robin", "geo", "capacity"
	BucketIDs []string          `json:"bucketIds"`
	GeoHints  map[string]string `json:"geoHints,omitempty"` // region -> bucket ID
	IsActive  bool              `json:"isActive"`
	CreatedAt time.Time         `json:"createdAt"`
	UpdatedAt time.Time         `json:"updatedAt"`
}

// CreateRoutingRuleRequest is the request body for creating a routing rule.
type CreateRoutingRuleRequest struct {
	Usage     string            `json:"usage"`
	Strategy  string            `json:"strategy,omitempty"`
	BucketIDs []string          `json:"bucketIds,omitempty"`
	GeoHints  map[string]string `json:"geoHints,omitempty"`
}

// UpdateRoutingRuleRequest is the request body for updating a routing rule.
type UpdateRoutingRuleRequest struct {
	Strategy  *string            `json:"strategy,omitempty"`
	BucketIDs *[]string          `json:"bucketIds,omitempty"`
	GeoHints  *map[string]string `json:"geoHints,omitempty"`
	IsActive  *bool              `json:"isActive,omitempty"`
}