package service

import (
	"context"
	"fmt"
	"time"

	"github.com/bedrivetech/wiitoo/pkg/storage"
	"github.com/bedrivetech/wiitoo/pkg/videopipeline"
	"github.com/bedrivetech/wiitoo/services/video/internal/config"
	"github.com/bedrivetech/wiitoo/services/video/internal/model"
	"github.com/bedrivetech/wiitoo/services/video/internal/repository"
	"github.com/google/uuid"
)

type VideoService struct {
	repo     *repository.VideoRepository
	store    storage.ObjectStore
	pipeline videopipeline.Pipeline
	cfg      *svcconfig.Config
}

func NewVideoService(repo *repository.VideoRepository, store storage.ObjectStore, p videopipeline.Pipeline, cfg *svcconfig.Config) *VideoService {
	return &VideoService{repo: repo, store: store, pipeline: p, cfg: cfg}
}

type UploadResponse struct {
	UploadID  string `json:"uploadId"`
	VideoID   string `json:"videoId"`
	UploadURL string `json:"uploadUrl"`
	ExpiresIn int    `json:"expiresIn"`
}

func (s *VideoService) RequestUpload(ctx context.Context, filename, contentType string, size int64) (*UploadResponse, error) {
	videoID := uuid.New().String()
	uploadID := uuid.New().String()
	key := fmt.Sprintf("uploads/%s/%s", videoID, filename)

	url, err := s.store.PresignedURL(ctx, s.cfg.StorageBucket, key, 15*time.Minute, "PUT")
	if err != nil {
		return nil, fmt.Errorf("failed to generate presigned URL: %w", err)
	}

	video := &model.Video{
		ID:          videoID,
		UploadID:    uploadID,
		Filename:    filename,
		ContentType: contentType,
		SizeBytes:   size,
		StorageKey:  key,
		Status:      "pending",
		CreatedAt:   time.Now(),
	}

	if err := s.repo.Create(ctx, video); err != nil {
		return nil, fmt.Errorf("failed to create video record: %w", err)
	}

	return &UploadResponse{
		UploadID:  uploadID,
		VideoID:   videoID,
		UploadURL: url,
		ExpiresIn: 900,
	}, nil
}

func (s *VideoService) CompleteUpload(ctx context.Context, uploadID, videoID string, size int64) (*model.Video, error) {
	video, err := s.repo.GetByID(ctx, videoID)
	if err != nil {
		return nil, err
	}
	video.Status = "uploaded"
	video.SizeBytes = size
	if err := s.repo.Update(ctx, video); err != nil {
		return nil, err
	}
	return video, nil
}

func (s *VideoService) StartProcessing(ctx context.Context, videoID string, resolutions []string) (*videopipeline.ProcessResponse, error) {
	video, err := s.repo.GetByID(ctx, videoID)
	if err != nil {
		return nil, err
	}

	if len(resolutions) == 0 {
		resolutions = []string{"720p", "480p", "360p"}
	}

	inputURL, err := s.store.PresignedURL(ctx, s.cfg.StorageBucket, video.StorageKey, 1*time.Hour, "GET")
	if err != nil {
		return nil, fmt.Errorf("failed to generate source URL: %w", err)
	}

	req := videopipeline.ProcessRequest{
		InputURL:    inputURL,
		OutputKey:   fmt.Sprintf("videos/%s/hls", videoID),
		Resolutions: resolutions,
		CallbackURL: fmt.Sprintf("%s/api/v1/video/%s/process-callback", s.cfg.PublicURL, videoID),
	}

	resp, err := s.pipeline.ProcessVideo(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("cloud processing request failed: %w", err)
	}

	video.Status = "processing"
	video.HLSURL = resp.MasterURL
	s.repo.Update(ctx, video)

	return resp, nil
}

func (s *VideoService) HandleProcessCallback(ctx context.Context, videoID, status, masterURL string) error {
	video, err := s.repo.GetByID(ctx, videoID)
	if err != nil {
		return err
	}

	if status == "completed" {
		video.Status = "ready"
		video.HLSURL = masterURL
	} else {
		video.Status = "failed"
	}

	return s.repo.Update(ctx, video)
}

func (s *VideoService) GetVideo(ctx context.Context, id string) (*model.Video, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *VideoService) ListVideos(ctx context.Context, category string, limit, offset int) ([]*model.Video, error) {
	return s.repo.List(ctx, category, limit, offset)
}

func (s *VideoService) GenerateClip(ctx context.Context, videoID string, startTime, duration float64, title string) (*videopipeline.ClipResponse, error) {
	video, err := s.repo.GetByID(ctx, videoID)
	if err != nil {
		return nil, err
	}

	sourceURL, err := s.store.PresignedURL(ctx, s.cfg.StorageBucket, video.StorageKey, 1*time.Hour, "GET")
	if err != nil {
		return nil, fmt.Errorf("failed to generate source URL: %w", err)
	}

	clipReq := videopipeline.ClipRequest{
		SourceURL: sourceURL,
		StartTime: startTime,
		Duration:  duration,
		Title:     title,
	}

	return s.pipeline.GenerateClip(ctx, clipReq)
}

func (s *VideoService) GenerateThumbnail(ctx context.Context, videoID string) (*videopipeline.ThumbnailResponse, error) {
	video, err := s.repo.GetByID(ctx, videoID)
	if err != nil {
		return nil, err
	}

	sourceURL, err := s.store.PresignedURL(ctx, s.cfg.StorageBucket, video.StorageKey, 1*time.Hour, "GET")
	if err != nil {
		return nil, fmt.Errorf("failed to generate source URL: %w", err)
	}

	thumbReq := videopipeline.ThumbnailRequest{
		SourceURL: sourceURL,
		OutputKey: fmt.Sprintf("videos/%s/thumb.jpg", videoID),
		Timestamp: 5,
		Width:     1280,
		Height:    720,
	}

	return s.pipeline.GenerateThumbnail(ctx, thumbReq)
}

// NewPipelineFromConfig creates a cloud video pipeline provider based on config.
// Supported providers: "gcore", "cloudflare" (default).
func NewPipelineFromConfig(provider string, cfg *svcconfig.Config) videopipeline.Pipeline {
	switch provider {
	case "gcore":
		return videopipeline.NewGcorePipeline(videopipeline.GcoreConfig{
			APIKey: cfg.GcoreAPIKey,
		})
	case "cloudflare":
		return videopipeline.NewCloudflarePipeline(videopipeline.CloudflareConfig{
			AccountID: cfg.CloudflareAccountID,
			APIToken:  cfg.CloudflareAPIToken,
		})
	default:
		// Default to cloudflare
		return videopipeline.NewCloudflarePipeline(videopipeline.CloudflareConfig{
			AccountID: cfg.CloudflareAccountID,
			APIToken:  cfg.CloudflareAPIToken,
		})
	}
}