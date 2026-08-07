package handler

import (
	"net/http"

	"github.com/bedrivetech/wiitoo/pkg/apierror"
	"github.com/bedrivetech/wiitoo/storage/internal/service"
)

// StorageHandler handles object upload/download endpoints.
type StorageHandler struct {
	bucketSvc *service.BucketService
}

// NewStorageHandler creates a new StorageHandler.
func NewStorageHandler(bucketSvc *service.BucketService) *StorageHandler {
	return &StorageHandler{bucketSvc: bucketSvc}
}

// Upload handles POST /api/v1/storage/upload (placeholder for direct uploads)
func (h *StorageHandler) Upload(w http.ResponseWriter, r *http.Request) {
	apierror.WriteData(w, http.StatusOK, map[string]string{"status": "upload endpoint ready"}, nil)
}

// Download handles GET /api/v1/storage/download/{bucket}/{key} (placeholder)
func (h *StorageHandler) Download(w http.ResponseWriter, r *http.Request) {
	apierror.WriteData(w, http.StatusOK, map[string]string{"status": "download endpoint ready"}, nil)
}