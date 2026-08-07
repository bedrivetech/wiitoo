package model

import "time"

type Video struct {
	ID          string    `json:"id"`
	UploadID    string    `json:"uploadId,omitempty"`
	UserID      string    `json:"userId,omitempty"`
	Filename    string    `json:"filename"`
	ContentType string    `json:"contentType"`
	SizeBytes   int64     `json:"sizeBytes"`
	StorageKey  string    `json:"-"`
	HLSURL      string    `json:"hlsUrl,omitempty"`
	Thumbnail   string    `json:"thumbnail,omitempty"`
	Status      string    `json:"status"`
	Duration    float64   `json:"duration,omitempty"`
	Category    string    `json:"category,omitempty"`
	Tags        []string  `json:"tags,omitempty"`
	IsMature    bool      `json:"isMature"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt,omitempty"`
	EndedAt     *time.Time `json:"endedAt,omitempty"`
}
