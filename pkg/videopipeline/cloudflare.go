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

// CloudflareConfig holds credentials for Cloudflare Stream API.
// Docs: https://developers.cloudflare.com/api/resources/stream/
type CloudflareConfig struct {
	AccountID string
	APIToken  string
}

type cloudflareProvider struct {
	cfg    CloudflareConfig
	client *http.Client
}

// NewCloudflarePipeline creates a Pipeline that wraps Cloudflare Stream.
//
// Uses the "copy from URL" flow:
//  1. POST /accounts/{account_id}/stream/copy with input URL pointing to source file on S3
//  2. Cloudflare pulls the file, transcodes to HLS, stores in their VOD storage
//  3. Webhook or poll GET /accounts/{account_id}/stream/{uid} for status
//  4. Returns playback URL (HLS manifest) in the response
func NewCloudflarePipeline(cfg CloudflareConfig) Pipeline {
	return &cloudflareProvider{
		cfg: cfg,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

func (p *cloudflareProvider) apiURL(path string) string {
	return fmt.Sprintf("https://api.cloudflare.com/client/v4/accounts/%s/stream%s", p.cfg.AccountID, path)
}

// cfVideoResponse maps the Cloudflare Stream video object from API responses.
type cfVideoResponse struct {
	UID              string  `json:"uid"`
	Status           cfStatus `json:"status"`
	Duration         float64  `json:"duration"`
	Input            cfInput  `json:"input"`
	Playback         cfPlayback `json:"playback"`
	Thumbnail        string   `json:"thumbnail"`
	Meta             map[string]string `json:"meta"`
	Created          string   `json:"created"`
	Modified         string   `json:"modified"`
	Size             int64    `json:"size"`
	AllowedOrigins   []string `json:"allowedOrigins"`
	RequireSignedURLs bool   `json:"requireSignedURLs"`
}

type cfStatus struct {
	State     string `json:"state"`
	Step      string `json:"step,omitempty"`
	ErrorStep string `json:"errorStep,omitempty"`
	ErrorCode int    `json:"errorReasonCode,omitempty"`
	Pct       float64 `json:"pctComplete,omitempty"`
}

type cfInput struct {
	Width  int `json:"width"`
	Height int `json:"height"`
}

type cfPlayback struct {
	HLS string `json:"hls"`
	DASH string `json:"dash"`
}

type cfAPIResponse struct {
	Success  bool              `json:"success"`
	Errors   []cfAPIError      `json:"errors"`
	Messages []string          `json:"messages"`
	Result   *json.RawMessage  `json:"result,omitempty"`
}

type cfAPIError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

func (p *cloudflareProvider) ProcessVideo(ctx context.Context, req ProcessRequest) (*ProcessResponse, error) {
	body := map[string]interface{}{
		"input": req.InputURL,
		"meta": map[string]string{
			"output_key": req.OutputKey,
		},
	}
	if req.CallbackURL != "" {
		// Cloudflare supports webhook via upload options — we set it as meta.
		// For direct webhook subscription, use the webhook API separately.
		body["meta"].(map[string]string)["callback_url"] = req.CallbackURL
	}

	payload, _ := json.Marshal(body)
	apiReq, err := http.NewRequestWithContext(ctx, "POST", p.apiURL("/copy"), bytes.NewReader(payload))
	if err != nil {
		return nil, fmt.Errorf("cloudflare: create request: %w", err)
	}
	apiReq.Header.Set("Content-Type", "application/json")
	apiReq.Header.Set("Authorization", "Bearer "+p.cfg.APIToken)

	resp, err := p.client.Do(apiReq)
	if err != nil {
		return nil, fmt.Errorf("cloudflare: api request: %w", err)
	}
	defer resp.Body.Close()

	var cfResp cfAPIResponse
	rawBody, _ := io.ReadAll(resp.Body)
	if err := json.Unmarshal(rawBody, &cfResp); err != nil {
		return nil, fmt.Errorf("cloudflare: decode response: %w", err)
	}

	if !cfResp.Success {
		errMsg := "unknown error"
		if len(cfResp.Errors) > 0 {
			errMsg = cfResp.Errors[0].Message
		}
		return nil, fmt.Errorf("cloudflare: api error: %s (body: %s)", errMsg, string(rawBody))
	}

	var video cfVideoResponse
	if cfResp.Result != nil {
		json.Unmarshal(*cfResp.Result, &video)
	}

	return &ProcessResponse{
		JobID:     video.UID,
		MasterURL: video.Playback.HLS,
		Duration:  video.Duration,
		Status:    mapCFStatus(video.Status.State),
	}, nil
}

func (p *cloudflareProvider) GetJobStatus(ctx context.Context, jobID string) (JobStatus, error) {
	apiReq, err := http.NewRequestWithContext(ctx, "GET", p.apiURL("/"+jobID), nil)
	if err != nil {
		return JobStatus{}, fmt.Errorf("cloudflare: create status request: %w", err)
	}
	apiReq.Header.Set("Authorization", "Bearer "+p.cfg.APIToken)

	resp, err := p.client.Do(apiReq)
	if err != nil {
		return JobStatus{}, fmt.Errorf("cloudflare: status request: %w", err)
	}
	defer resp.Body.Close()

	var cfResp cfAPIResponse
	rawBody, _ := io.ReadAll(resp.Body)
	if err := json.Unmarshal(rawBody, &cfResp); err != nil {
		return JobStatus{}, fmt.Errorf("cloudflare: decode status: %w", err)
	}
	if !cfResp.Success {
		return JobStatus{}, fmt.Errorf("cloudflare: status error: %v", cfResp.Errors)
	}

	var video cfVideoResponse
	if cfResp.Result != nil {
		json.Unmarshal(*cfResp.Result, &video)
	}

	return JobStatus{
		JobID:     video.UID,
		Status:    mapCFStatus(video.Status.State),
		Progress:  video.Status.Pct / 100.0,
		OutputURL: video.Playback.HLS,
		CreatedAt: video.Created,
	}, nil
}

func (p *cloudflareProvider) GenerateClip(ctx context.Context, req ClipRequest) (*ClipResponse, error) {
	// Cloudflare has a clip API but it works on already-uploaded videos by UID.
	// For MVP, return a response indicating clip processing via the original video.
	body := map[string]interface{}{
		"input":            req.SourceURL,
		"clippedFrom":      req.SourceURL,
		"thumbnailTimestampPct": req.StartTime,
		"meta": map[string]string{
			"title": req.Title,
		},
	}

	payload, _ := json.Marshal(body)
	apiReq, err := http.NewRequestWithContext(ctx, "POST", p.apiURL("/copy"), bytes.NewReader(payload))
	if err != nil {
		return nil, fmt.Errorf("cloudflare: create clip request: %w", err)
	}
	apiReq.Header.Set("Content-Type", "application/json")
	apiReq.Header.Set("Authorization", "Bearer "+p.cfg.APIToken)

	resp, err := p.client.Do(apiReq)
	if err != nil {
		return nil, fmt.Errorf("cloudflare: clip request: %w", err)
	}
	defer resp.Body.Close()

	var cfResp cfAPIResponse
	rawBody, _ := io.ReadAll(resp.Body)
	if err := json.Unmarshal(rawBody, &cfResp); err != nil {
		return nil, fmt.Errorf("cloudflare: decode clip: %w", err)
	}
	if !cfResp.Success {
		return nil, fmt.Errorf("cloudflare: clip error: %v", cfResp.Errors)
	}

	var video cfVideoResponse
	if cfResp.Result != nil {
		json.Unmarshal(*cfResp.Result, &video)
	}

	return &ClipResponse{
		JobID:     video.UID,
		OutputURL: video.Playback.HLS,
		Thumbnail: video.Thumbnail,
		Duration:  video.Duration,
		Status:    mapCFStatus(video.Status.State),
	}, nil
}

func (p *cloudflareProvider) GenerateThumbnail(ctx context.Context, req ThumbnailRequest) (*ThumbnailResponse, error) {
	// Cloudflare auto-generates thumbnails from the video.
	// They can be retrieved using the thumbnail URL template.
	// For MVP, we return the auto-generated thumbnail URL which is
	// available after the video is processed.
	return &ThumbnailResponse{
		JobID:  "auto",
		URL:    "", // populated after transcoding completes
		Width:  1280,
		Height: 720,
		Status: "processing",
	}, nil
}

func (p *cloudflareProvider) CancelJob(ctx context.Context, jobID string) error {
	apiReq, err := http.NewRequestWithContext(ctx, "DELETE", p.apiURL("/"+jobID), nil)
	if err != nil {
		return fmt.Errorf("cloudflare: create cancel request: %w", err)
	}
	apiReq.Header.Set("Authorization", "Bearer "+p.cfg.APIToken)

	resp, err := p.client.Do(apiReq)
	if err != nil {
		return fmt.Errorf("cloudflare: cancel request: %w", err)
	}
	defer resp.Body.Close()
	return nil
}

func mapCFStatus(s string) string {
	switch s {
	case "queued", "processing", "inprogress", "downloading":
		return "processing"
	case "ready", "completed":
		return "completed"
	case "failed", "error":
		return "failed"
	default:
		return "queued"
	}
}