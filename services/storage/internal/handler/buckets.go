package handler

import (
	"encoding/json"
	"net/http"

	"github.com/bedrivetech/wiitoo/pkg/apierror"
	"github.com/bedrivetech/wiitoo/storage/internal/model"
	"github.com/bedrivetech/wiitoo/storage/internal/service"
	"github.com/go-chi/chi/v5"
)

// BucketHandler handles CRUD operations for storage buckets.
type BucketHandler struct {
	bucketSvc *service.BucketService
}

// NewBucketHandler creates a new BucketHandler.
func NewBucketHandler(bucketSvc *service.BucketService) *BucketHandler {
	return &BucketHandler{bucketSvc: bucketSvc}
}

// List handles GET /api/v1/admin/storage/buckets
func (h *BucketHandler) List(w http.ResponseWriter, r *http.Request) {
	buckets, err := h.bucketSvc.ListBuckets(r.Context())
	if err != nil {
		apierror.WriteInternalError(w, "list buckets failed", err)
		return
	}
	if buckets == nil {
		buckets = []model.StorageBucket{}
	}
	apierror.WriteData(w, http.StatusOK, buckets, nil)
}

// Get handles GET /api/v1/admin/storage/buckets/{id}
func (h *BucketHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	bucket, err := h.bucketSvc.GetBucket(r.Context(), id)
	if err != nil {
		apierror.WriteInternalError(w, "get bucket failed", err)
		return
	}
	if bucket == nil {
		apierror.WriteError(w, apierror.ErrNotFound)
		return
	}
	apierror.WriteData(w, http.StatusOK, bucket, nil)
}

// Create handles POST /api/v1/admin/storage/buckets
func (h *BucketHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req model.CreateBucketRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		apierror.WriteJSON(w, http.StatusBadRequest, apierror.APIResponse{
			Success: false,
			Error:   apierror.ErrInvalidRequestBody,
		})
		return
	}

	bucket, err := h.bucketSvc.CreateBucket(r.Context(), req)
	if err != nil {
		apierror.WriteJSON(w, http.StatusBadRequest, apierror.APIResponse{
			Success: false,
			Error:   &apierror.APIError{Code: apierror.ErrCodeValidationError, Message: err.Error()},
		})
		return
	}

	apierror.WriteData(w, http.StatusCreated, bucket, nil)
}

// Update handles PUT /api/v1/admin/storage/buckets/{id}
func (h *BucketHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req model.UpdateBucketRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		apierror.WriteJSON(w, http.StatusBadRequest, apierror.APIResponse{
			Success: false,
			Error:   apierror.ErrInvalidRequestBody,
		})
		return
	}

	bucket, err := h.bucketSvc.UpdateBucket(r.Context(), id, req)
	if err != nil {
		apierror.WriteInternalError(w, "update bucket failed", err)
		return
	}
	if bucket == nil {
		apierror.WriteError(w, apierror.ErrNotFound)
		return
	}

	apierror.WriteData(w, http.StatusOK, bucket, nil)
}

// Delete handles DELETE /api/v1/admin/storage/buckets/{id}
func (h *BucketHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.bucketSvc.DeleteBucket(r.Context(), id); err != nil {
		apierror.WriteInternalError(w, "delete bucket failed", err)
		return
	}
	apierror.WriteData(w, http.StatusOK, map[string]string{"status": "deleted"}, nil)
}

// Sync handles POST /api/v1/admin/storage/buckets/{id}/sync
func (h *BucketHandler) Sync(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	bucket, err := h.bucketSvc.SyncBucketUsage(r.Context(), id)
	if err != nil {
		apierror.WriteInternalError(w, "sync bucket failed", err)
		return
	}
	if bucket == nil {
		apierror.WriteError(w, apierror.ErrNotFound)
		return
	}
	apierror.WriteData(w, http.StatusOK, bucket, nil)
}