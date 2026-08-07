// Package stream provides shared types for live streaming operations.
package stream

import "time"

// StreamStatus represents the current state of a live stream.
type StreamStatus string

const (
	StreamStatusIdle     StreamStatus = "idle"
	StreamStatusStarting StreamStatus = "starting"
	StreamStatusLive     StreamStatus = "live"
	StreamStatusEnding   StreamStatus = "ending"
	StreamStatusEnded    StreamStatus = "ended"
	StreamStatusError    StreamStatus = "error"
)

// Stream represents a live stream session.
type Stream struct {
	ID             string       `json:"id"`
	UserID         string       `json:"userId"`
	Title          string       `json:"title"`
	Category       string       `json:"category"`
	Tags           []string     `json:"tags"`
	Thumbnail      string       `json:"thumbnail"`
	StreamKey      string       `json:"-"` // Never exposed to API responses
	RTMPURL        string       `json:"rtmpUrl"`
	Status         StreamStatus `json:"status"`
	ViewerCount    int          `json:"viewerCount"`
	MaxViewers     int          `json:"maxViewers"`
	StartedAt      *time.Time   `json:"startedAt,omitempty"`
	EndedAt        *time.Time   `json:"endedAt,omitempty"`
	Duration       int          `json:"duration"` // Seconds (for ended streams)
	VODKey         string       `json:"vodKey,omitempty"` // Object store key if VOD saved
	IsMature       bool         `json:"isMature"`
	CreatedAt      time.Time    `json:"createdAt"`
	UpdatedAt      time.Time    `json:"updatedAt"`
}

// SimulcastTarget represents an external platform to simulcast to.
type SimulcastTarget struct {
	Platform   string `json:"platform"`   // "youtube", "twitch", "kick", "rumble"
	RTMPURL    string `json:"rtmpUrl"`    // e.g., "rtmp://a.rtmp.youtube.com/live2"
	StreamKey  string `json:"streamKey"`  // Encrypted at rest
	Enabled    bool   `json:"enabled"`
}

// ChatMessage represents a message in a stream's chat.
type ChatMessage struct {
	ID          string    `json:"id"`
	StreamID    string    `json:"streamId"`
	UserID      string    `json:"userId"`
	Username    string    `json:"username"`
	DisplayName string    `json:"displayName"`
	Body        string    `json:"body"`
	IsModerated bool      `json:"isModerated"`
	IsHighlighted bool    `json:"isHighlighted"` // Superchat / tipped message
	TipAmount   float64   `json:"tipAmount,omitempty"`
	Badges      []string  `json:"badges,omitempty"`
	Emotes      []string  `json:"emotes,omitempty"`
	SentAt      time.Time `json:"sentAt"`
}

// Category represents a stream category/game.
type Category struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Slug        string `json:"slug"`
	Description string `json:"description"`
	Thumbnail   string `json:"thumbnail"`
	ViewerCount int    `json:"viewerCount"`
	StreamCount int    `json:"streamCount"`
}

// IngestServer represents an RTMP ingest endpoint.
type IngestServer struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Hostname string `json:"hostname"`
	Port     int    `json:"port"`
	Region   string `json:"region"`
	Priority int    `json:"priority"` // Lower = preferred
}

// AnalyticsSnapshot is a point-in-time snapshot of stream analytics.
type AnalyticsSnapshot struct {
	StreamID        string    `json:"streamId"`
	Timestamp       time.Time `json:"timestamp"`
	ViewerCount     int       `json:"viewerCount"`
	ChatRate        float64   `json:"chatRate"`        // Messages per minute
	NewFollowers    int       `json:"newFollowers"`
	NewSubscribers  int       `json:"newSubscribers"`
	BitsDonated     float64   `json:"bitsDonated"`
}