// Package transcode provides interfaces for video transcoding.
// Provider-agnostic: Mux, Cloudflare Stream, Gcore, FFmpeg (self-hosted).
package transcode

import "context"

// Transcoder is the interface for video transcoding operations.
type Transcoder interface {
	// TranscodeToHLS transcodes a video file to HLS (multi-bitrate).
	// Returns the path/URL to the master playlist.
	TranscodeToHLS(ctx context.Context, req HLSRequest) (*HLSResponse, error)

	// TranscodeToMP4 transcodes a video to a downloadable MP4.
	TranscodeToMP4(ctx context.Context, req MP4Request) (*MP4Response, error)

	// GenerateClip trims a segment from a stream recording.
	GenerateClip(ctx context.Context, req ClipRequest) (*ClipResponse, error)

	// GenerateThumbnail extracts a frame from a video at the given timestamp.
	GenerateThumbnail(ctx context.Context, req ThumbnailRequest) (*ThumbnailResponse, error)

	// GetStatus returns the current status of a transcode job.
	GetStatus(ctx context.Context, jobID string) (JobStatus, error)

	// GetPreset returns the transcode preset configuration.
	GetPreset(preset string) (Preset, error)
}

// HLSRequest describes a request to transcode a video to HLS.
type HLSRequest struct {
	InputKey    string   `json:"inputKey"`    // Object store key of source video
	Bucket      string   `json:"bucket"`      // Object store bucket
	OutputKey   string   `json:"outputKey"`   // Base output key (e.g., "videos/abc123/hls")
	Resolutions []string `json:"resolutions"` // ["1080p", "720p", "480p", "360p"]
	CallbackURL string   `json:"callbackUrl,omitempty"`
}

// HLSResponse contains the result of an HLS transcode request.
type HLSResponse struct {
	JobID        string   `json:"jobId"`
	MasterURL    string   `json:"masterUrl"`   // URL to master.m3u8
	PlaylistURLs []string `json:"playlistUrls"` // URLs to each rendition's playlist
	Duration     float64  `json:"duration"`     // Seconds
	Status       string   `json:"status"`
}

// MP4Request describes a request to transcode to MP4.
type MP4Request struct {
	InputKey   string `json:"inputKey"`
	Bucket     string `json:"bucket"`
	OutputKey  string `json:"outputKey"`
	Resolution string `json:"resolution,omitempty"` // "1080p", "720p", "source"
	Quality    int    `json:"quality,omitempty"`    // 0-100, higher = better
}

// MP4Response contains the result of an MP4 transcode request.
type MP4Response struct {
	JobID    string  `json:"jobId"`
	OutputURL string `json:"outputUrl"`
	SizeBytes int64   `json:"sizeBytes"`
	Status   string  `json:"status"`
}

// ClipRequest describes a request to generate a clip from a stream.
type ClipRequest struct {
	StreamKey string  `json:"streamKey"` // Object store key of the full stream recording
	Bucket    string  `json:"bucket"`
	StartTime float64 `json:"startTime"` // Seconds from start
	Duration  float64 `json:"duration"`  // Clip length in seconds (max 120)
	Title     string  `json:"title,omitempty"`
}

// ClipResponse contains the result of a clip generation request.
type ClipResponse struct {
	JobID     string  `json:"jobId"`
	ClipKey   string  `json:"clipKey"`
	Thumbnail string  `json:"thumbnail"`
	Duration  float64 `json:"duration"`
	Status    string  `json:"status"`
}

// ThumbnailRequest describes a request to generate a thumbnail.
type ThumbnailRequest struct {
	InputKey  string  `json:"inputKey"`
	Bucket    string  `json:"bucket"`
	OutputKey string  `json:"outputKey"`
	Timestamp float64 `json:"timestamp"` // Seconds into the video
	Width     int     `json:"width,omitempty"`
	Height    int     `json:"height,omitempty"`
}

// ThumbnailResponse contains the result of a thumbnail generation request.
type ThumbnailResponse struct {
	JobID   string `json:"jobId"`
	URL     string `json:"url"`
	Width   int    `json:"width"`
	Height  int    `json:"height"`
	Status  string `json:"status"`
}

// JobStatus represents the current state of a transcode job.
type JobStatus struct {
	JobID     string  `json:"jobId"`
	Status    string  `json:"status"` // "queued", "processing", "completed", "failed"
	Progress  float64 `json:"progress,omitempty"` // 0.0 - 1.0
	Error     string  `json:"error,omitempty"`
	OutputURL string  `json:"outputUrl,omitempty"`
	CreatedAt string  `json:"createdAt"`
}

// Preset defines a transcode configuration preset.
type Preset struct {
	Name        string `json:"name"`
	VideoCodec  string `json:"videoCodec"`  // "h264", "h265", "av1"
	AudioCodec  string `json:"audioCodec"`  // "aac", "opus"
	VideoBitrateKbps int `json:"videoBitrateKbps"`
	AudioBitrateKbps int `json:"audioBitrateKbps"`
	Width       int    `json:"width"`
	Height      int    `json:"height"`
	FPS         int    `json:"fps"`
}

// Standard presets.
var Presets = map[string]Preset{
	"source": {Name: "source", VideoCodec: "copy", AudioCodec: "copy"},
	"1080p":  {Name: "1080p", VideoCodec: "h264", AudioCodec: "aac", VideoBitrateKbps: 6000, AudioBitrateKbps: 128, Width: 1920, Height: 1080, FPS: 30},
	"720p":   {Name: "720p", VideoCodec: "h264", AudioCodec: "aac", VideoBitrateKbps: 3000, AudioBitrateKbps: 96, Width: 1280, Height: 720, FPS: 30},
	"480p":   {Name: "480p", VideoCodec: "h264", AudioCodec: "aac", VideoBitrateKbps: 1500, AudioBitrateKbps: 64, Width: 854, Height: 480, FPS: 30},
	"360p":   {Name: "360p", VideoCodec: "h264", AudioCodec: "aac", VideoBitrateKbps: 800, AudioBitrateKbps: 48, Width: 640, Height: 360, FPS: 30},
}