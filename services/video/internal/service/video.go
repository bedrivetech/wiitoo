package service

import (
	"context"
	"fmt"
	"time"

	"github.com/fusion-platform/pkg/queue"
	"github.com/fusion-platform/pkg/storage"
	"github.com/fusion-platform/pkg/transcode"
	"github.com/fusion-platform/video/internal/config"
	"github.com/fusion-platform/video/internal/model"
	"github.com/fusion-platform/video/internal/repository"
	"github.com/google/uuid"
)

type VideoService struct {
	repo      *repository.VideoRepository
	store     storage.ObjectStore
	transcoder transcode.Transcoder
	taskQueue *VideoTaskQueue
	cfg       *svcconfig.Config
}

func NewVideoService(repo *repository.VideoRepository, store storage.ObjectStore, t transcoder.Transcoder, tq *VideoTaskQueue, cfg *svcconfig.Config) *VideoService {
	return &VideoService{repo: repo, store: store, transcoder: t, taskQueue: tq, cfg: cfg}
}

type UploadResponse struct {
	UploadID    string `json:"uploadId"`
	VideoID     string `json:"videoId"`
	UploadURL   string `json:"uploadUrl"`
	ExpiresIn   int    `json:"expiresIn"`
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

func (s *VideoService) Transcode(ctx context.Context, videoID string, resolutions []string) (*transcode.HLSResponse, error) {
	video, err := s.repo.GetByID(ctx, videoID)
	if err != nil {
		return nil, err
	}

	if len(resolutions) == 0 {
		resolutions = []string{"720p", "480p", "360p"}
	}

	req := transcode.HLSRequest{
		InputKey:    video.StorageKey,
		Bucket:      s.cfg.StorageBucket,
		OutputKey:   fmt.Sprintf("videos/%s/hls", videoID),
		Resolutions: resolutions,
	}

	resp, err := s.transcoder.TranscodeToHLS(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("transcode failed: %w", err)
	}

	video.Status = "processing"
	video.HLSURL = resp.MasterURL
	s.repo.Update(ctx, video)

	return resp, nil
}

func (s *VideoService) GetVideo(ctx context.Context, id string) (*model.Video, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *VideoService) ListVideos(ctx context.Context, category string, limit, offset int) ([]*model.Video, error) {
	return s.repo.List(ctx, category, limit, offset)
}

func (s *VideoService) GenerateClip(ctx context.Context, videoID string, startTime, duration float64, title string) (*transcode.ClipResponse, error) {
	video, err := s.repo.GetByID(ctx, videoID)
	if err != nil {
		return nil, err
	}

	clipReq := transcode.ClipRequest{
		StreamKey: video.StorageKey,
		Bucket:    s.cfg.StorageBucket,
		StartTime: startTime,
		Duration:  duration,
		Title:     title,
	}

	return s.transcoder.GenerateClip(ctx, clipReq)
}

func (s *VideoService) GenerateThumbnail(ctx context.Context, videoID string) (*transcode.ThumbnailResponse, error) {
	video, err := s.repo.GetByID(ctx, videoID)
	if err != nil {
		return nil, err
	}

	thumbReq := transcode.ThumbnailRequest{
		InputKey:  video.StorageKey,
		Bucket:    s.cfg.StorageBucket,
		OutputKey: fmt.Sprintf("videos/%s/thumb.jpg", videoID),
		Timestamp: 5,
		Width:     1280,
		Height:    720,
	}

	return s.transcoder.GenerateThumbnail(ctx, thumbReq)
}

func (s *VideoService) ListPresets() map[string]transcode.Preset {
	return transcode.Presets
}

// VideoTaskQueue wraps Asynq for video-specific tasks.
type VideoTaskQueue struct {
	queue queue.TaskQueue
}

func NewVideoTaskQueue(redisURL string) *VideoTaskQueue {
	return &VideoTaskQueue{}
}

func (q *VideoTaskQueue) EnqueueTranscode(ctx context.Context, videoID string, resolutions []string) error {
	return nil
}
