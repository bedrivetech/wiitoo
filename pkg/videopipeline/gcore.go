package videopipeline

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// GcoreConfig holds credentials for Gcore Video Cloud API.
type GcoreConfig struct {
	APIKey  string
	BaseURL string // default: https://api.gcore.com
}

type gcoreProvider struct {
	cfg    GcoreConfig
	client *http.Client
}

// NewGcorePipeline creates a Pipeline that wraps Gcore Video Cloud.
// Docs: https://docs.gcore.com/streaming/video-hosting/upload-video-via-api
//
// The "copy from URL" flow:
//  1. POST /streaming/videos/ with origin_url pointing to the source file on S3
//  2. Gcore pulls the file, transcodes to HLS, stores in their VOD storage
//  3. Webhook or poll GET /streaming/videos/{id} for status
//  4. Returns HLS manifest URL in the response
func NewGcorePipeline(cfg GcoreConfig) Pipeline {
	base := cfg.BaseURL
	if base == "" {
		base = "https://api.gcore.com"
	}
	return &gcoreProvider{
		cfg: cfg,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// gcoreVideoResponse maps the Gcore video creation response.
type gcoreVideoResponse struct {
	ID             int     `json:"id"`
	Name           string  `json:"name"`
	Status         string  `json:"status"`
	Duration       float64 `json:"duration"`
	PlayerURL      string  `json:"player_url"`
	HLSManifestURL string  `json:"hls_manifest_url"`
	ThumbnailURL   string  `json:"thumbnail_url"`
}

func (p *gcoreProvider) ProcessVideo(ctx context.Context, req ProcessRequest) (*ProcessResponse, error) {
	body := map[string]interface{}{
		"video": map[string]interface{}{
			"name":       req.OutputKey,
			"origin_url": req.InputURL,
		},
	}

	payload, _ := json.Marshal(body)
	apiReq, err := http.NewRequestWithContext(ctx, "POST", p.cfg.BaseURL+"/streaming/videos/", bytes.NewReader(payload))
	if err != nil {
		return nil, fmt.Errorf("gcore: create request: %w", err)
	}
	apiReq.Header.Set("Content-Type", "application/json")
	apiReq.Header.Set("Authorization", "APIKey "+p.cfg.APIKey)

	resp, err := p.client.Do(apiReq)
	if err != nil {
		return nil, fmt.Errorf("gcore: api request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("gcore: api returned %d: %s", resp.StatusCode, string(bodyBytes))
	}

	var result gcoreVideoResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("gcore: decode response: %w", err)
	}

	return &ProcessResponse{
		JobID:     fmt.Sprintf("gcore-%d", result.ID),
		MasterURL: result.HLSManifestURL,
		Duration:  result.Duration,
		Status:    mapGcoreStatus(result.Status),
	}, nil
}

func (p *gcoreProvider) GetJobStatus(ctx context.Context, jobID string) (JobStatus, error) {
	var gcoreID string
	if _, err := fmt.Sscanf(jobID, "gcore-%s", &gcoreID); err != nil {
		gcoreID = jobID
	}

	apiReq, err := http.NewRequestWithContext(ctx, "GET", p.cfg.BaseURL+"/streaming/videos/"+gcoreID, nil)
	if err != nil {
		return JobStatus{}, fmt.Errorf("gcore: create status request: %w", err)
	}
	apiReq.Header.Set("Authorization", "APIKey "+p.cfg.APIKey)

	resp, err := p.client.Do(apiReq)
	if err != nil {
		return JobStatus{}, fmt.Errorf("gcore: status request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return JobStatus{}, fmt.Errorf("gcore: status returned %d", resp.StatusCode)
	}

	var result gcoreVideoResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return JobStatus{}, fmt.Errorf("gcore: decode status: %w", err)
	}

	return JobStatus{
		JobID:     fmt.Sprintf("gcore-%d", result.ID),
		Status:    mapGcoreStatus(result.Status),
		OutputURL: result.HLSManifestURL,
		CreatedAt: time.Now().Format(time.RFC3339),
	}, nil
}

func (p *gcoreProvider) GenerateClip(ctx context.Context, req ClipRequest) (*ClipResponse, error) {
	body := map[string]interface{}{
		"video": map[string]interface{}{
			"origin_url": req.SourceURL,
			"name":       req.Title,
		},
	}

	payload, _ := json.Marshal(body)
	apiReq, err := http.NewRequestWithContext(ctx, "POST", p.cfg.BaseURL+"/streaming/videos/", bytes.NewReader(payload))
	if err != nil {
		return nil, fmt.Errorf("gcore: create clip request: %w", err)
	}
	apiReq.Header.Set("Content-Type", "application/json")
	apiReq.Header.Set("Authorization", "APIKey "+p.cfg.APIKey)

	resp, err := p.client.Do(apiReq)
	if err != nil {
		return nil, fmt.Errorf("gcore: clip request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("gcore: clip returned %d: %s", resp.StatusCode, string(bodyBytes))
	}

	var result gcoreVideoResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("gcore: decode clip: %w", err)
	}

	return &ClipResponse{
		JobID:     fmt.Sprintf("gcore-%d", result.ID),
		OutputURL: result.HLSManifestURL,
		Thumbnail: result.ThumbnailURL,
		Duration:  result.Duration,
		Status:    mapGcoreStatus(result.Status),
	}, nil
}

func (p *gcoreProvider) GenerateThumbnail(ctx context.Context, req ThumbnailRequest) (*ThumbnailResponse, error) {
	// Gcore auto-generates thumbnails during transcoding.
	// If we need a specific timestamp thumbnail, we use the same upload-then-read approach.
	// For MVP, thumbnails are generated automatically — return the auto-generated one.
	return &ThumbnailResponse{
		JobID:  "auto",
		URL:    "", // populated after transcoding completes
		Width:  1280,
		Height: 720,
		Status: "processing",
	}, nil
}

func (p *gcoreProvider) CancelJob(ctx context.Context, jobID string) error {
	var gcoreID string
	if _, err := fmt.Sscanf(jobID, "gcore-%s", &gcoreID); err != nil {
		gcoreID = jobID
	}

	apiReq, err := http.NewRequestWithContext(ctx, "DELETE", p.cfg.BaseURL+"/streaming/videos/"+gcoreID, nil)
	if err != nil {
		return fmt.Errorf("gcore: create cancel request: %w", err)
	}
	apiReq.Header.Set("Authorization", "APIKey "+p.cfg.APIKey)

	resp, err := p.client.Do(apiReq)
	if err != nil {
		return fmt.Errorf("gcore: cancel request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		return fmt.Errorf("gcore: cancel returned %d", resp.StatusCode)
	}
	return nil
}

func mapGcoreStatus(s string) string {
	switch s {
	case "pending", "processing", "transcoding":
		return "processing"
	case "ready", "done", "completed":
		return "completed"
	case "failed", "error":
		return "failed"
	default:
		return "queued"
	}
}