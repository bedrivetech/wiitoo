// Package videopipeline provides a cloud-PaaS abstraction for video processing.
// All implementations call external APIs (Gcore Video Cloud, Cloudflare Stream, Mux, etc.).
// No self-hosted FFmpeg or local transcoding — this is a thin API client layer.
package videopipeline

import "context"

// Pipeline is the interface for cloud video processing operations.
// Implementations wrap third-party API calls (Gcore, Cloudflare, Mux, etc.).
type Pipeline interface {
	// ProcessVideo submits a video for cloud processing (HLS packaging, multi-bitrate).
	// Returns the job ID from the cloud provider.
	ProcessVideo(ctx context.Context, req ProcessRequest) (*ProcessResponse, error)

	// GetJobStatus returns the current status of a processing job.
	GetJobStatus(ctx context.Context, jobID string) (JobStatus, error)

	// GenerateClip submits a clip generation job to the cloud pipeline.
	GenerateClip(ctx context.Context, req ClipRequest) (*ClipResponse, error)

	// GenerateThumbnail submits a thumbnail extraction job.
	GenerateThumbnail(ctx context.Context, req ThumbnailRequest) (*ThumbnailResponse, error)

	// CancelJob cancels a pending or in-progress processing job.
	CancelJob(ctx context.Context, jobID string) error
}

// ProcessRequest describes a request to process a video through the cloud pipeline.
type ProcessRequest struct {
	InputURL    string   `json:"inputUrl"`    // Presigned or public URL to the source file
	OutputKey   string   `json:"outputKey"`   // Base output path (e.g., "videos/abc123/hls")
	Resolutions []string `json:"resolutions"` // ["1080p", "720p", "480p", "360p"]
	CallbackURL string   `json:"callbackUrl,omitempty"` // Webhook for completion notification
}

// ProcessResponse contains the result of a processing request.
type ProcessResponse struct {
	JobID       string   `json:"jobId"`
	MasterURL   string   `json:"masterUrl"`   // URL to master.m3u8
	PlaylistURLs []string `json:"playlistUrls"` // URLs to each rendition's playlist
	Duration    float64  `json:"duration"`     // Seconds
	Status      string   `json:"status"`
}

// ClipRequest describes a request to generate a clip.
type ClipRequest struct {
	SourceURL string  `json:"sourceUrl"` // URL to source video
	StartTime float64 `json:"startTime"` // Seconds from start
	Duration  float64 `json:"duration"`  // Clip length in seconds (max 120)
	Title     string  `json:"title,omitempty"`
	CallbackURL string `json:"callbackUrl,omitempty"`
}

// ClipResponse contains the result of a clip generation request.
type ClipResponse struct {
	JobID     string  `json:"jobId"`
	OutputURL string  `json:"outputUrl"`
	Thumbnail string  `json:"thumbnail"`
	Duration  float64 `json:"duration"`
	Status    string  `json:"status"`
}

// ThumbnailRequest describes a request to generate a thumbnail.
type ThumbnailRequest struct {
	SourceURL string  `json:"sourceUrl"`
	OutputKey string  `json:"outputKey"`
	Timestamp float64 `json:"timestamp"` // Seconds into the video
	Width     int     `json:"width,omitempty"`
	Height    int     `json:"height,omitempty"`
	CallbackURL string `json:"callbackUrl,omitempty"`
}

// ThumbnailResponse contains the result of a thumbnail generation request.
type ThumbnailResponse struct {
	JobID  string `json:"jobId"`
	URL    string `json:"url"`
	Width  int    `json:"width"`
	Height int    `json:"height"`
	Status string `json:"status"`
}

// JobStatus represents the current state of a processing job.
type JobStatus struct {
	JobID     string  `json:"jobId"`
	Status    string  `json:"status"` // "queued", "processing", "completed", "failed"
	Progress  float64 `json:"progress,omitempty"` // 0.0 - 1.0
	Error     string  `json:"error,omitempty"`
	OutputURL string  `json:"outputUrl,omitempty"`
	CreatedAt string  `json:"createdAt"`
}