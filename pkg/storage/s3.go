package storage

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
)

// S3Store implements ObjectStore for any S3-compatible API.
// Works with: AWS S3, Cloudflare R2, GCS (S3 compat), MinIO, Backblaze B2.
type S3Store struct {
	client *s3.Client
}

// S3Config holds connection details for an S3-compatible provider.
type S3Config struct {
	Endpoint  string // e.g., "https://s3.us-east-1.amazonaws.com" or "https://<account>.r2.cloudflarestorage.com"
	Region    string // e.g., "us-east-1" or "auto" for R2
	AccessKey string
	SecretKey string
}

// NewS3Store creates a new S3-compatible object store client.
func NewS3Store(cfg S3Config) (*S3Store, error) {
	awsCfg, err := config.LoadDefaultConfig(context.Background(),
		config.WithRegion(cfg.Region),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(cfg.AccessKey, cfg.SecretKey, "")),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to load AWS config: %w", err)
	}

	client := s3.NewFromConfig(awsCfg, func(o *s3.Options) {
		if cfg.Endpoint != "" {
			o.BaseEndpoint = aws.String(cfg.Endpoint)
		}
		// For Cloudflare R2 and other path-style stores
		o.UsePathStyle = true
	})

	return &S3Store{client: client}, nil
}

func (s *S3Store) Upload(ctx context.Context, bucket, key string, r io.Reader, opts ...UploadOption) error {
	opt := &UploadOptions{}
	for _, o := range opts {
		o(opt)
	}

	data, err := io.ReadAll(r)
	if err != nil {
		return fmt.Errorf("failed to read upload data: %w", err)
	}

	input := &s3.PutObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
		Body:   bytes.NewReader(data),
	}

	if opt.ContentType != "" {
		input.ContentType = aws.String(opt.ContentType)
	}
	if opt.ContentEncoding != "" {
		input.ContentEncoding = aws.String(opt.ContentEncoding)
	}
	if opt.CacheControl != "" {
		input.CacheControl = aws.String(opt.CacheControl)
	}
	if len(opt.Metadata) > 0 {
		input.Metadata = opt.Metadata
	}

	_, err = s.client.PutObject(ctx, input)
	if err != nil {
		return fmt.Errorf("s3 upload failed: %w", err)
	}
	return nil
}

func (s *S3Store) Download(ctx context.Context, bucket, key string) (io.ReadCloser, error) {
	output, err := s.client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		var nsk *types.NoSuchKey
		if errors.As(err, &nsk) {
			return nil, fmt.Errorf("key not found: %s/%s: %w", bucket, key, ErrObjectNotFound)
		}
		return nil, fmt.Errorf("s3 download failed: %w", err)
	}
	return output.Body, nil
}

func (s *S3Store) Delete(ctx context.Context, bucket, key string) error {
	_, err := s.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return fmt.Errorf("s3 delete failed: %w", err)
	}
	return nil
}

func (s *S3Store) Exists(ctx context.Context, bucket, key string) (bool, error) {
	_, err := s.client.HeadObject(ctx, &s3.HeadObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		var nsk *types.NoSuchKey
		if errors.As(err, &nsk) {
			return false, nil
		}
		return false, fmt.Errorf("s3 head failed: %w", err)
	}
	return true, nil
}

func (s *S3Store) List(ctx context.Context, bucket, prefix string, opts ...ListOption) ([]ObjectInfo, error) {
	opt := &ListOptions{MaxKeys: 100}
	for _, o := range opts {
		o(opt)
	}

	input := &s3.ListObjectsV2Input{
		Bucket:  aws.String(bucket),
		Prefix:  aws.String(prefix),
		MaxKeys: aws.Int32(opt.MaxKeys),
	}
	if opt.StartAfter != "" {
		input.StartAfter = aws.String(opt.StartAfter)
	}

	output, err := s.client.ListObjectsV2(ctx, input)
	if err != nil {
		return nil, fmt.Errorf("s3 list failed: %w", err)
	}

	infos := make([]ObjectInfo, 0, len(output.Contents))
	for _, obj := range output.Contents {
		info := ObjectInfo{
			Key:          aws.ToString(obj.Key),
			Size:         aws.ToInt64(obj.Size),
			ETag:         aws.ToString(obj.ETag),
			LastModified: aws.ToTime(obj.LastModified),
		}
		infos = append(infos, info)
	}
	return infos, nil
}

func (s *S3Store) PresignedURL(ctx context.Context, bucket, key string, ttl time.Duration, method string) (string, error) {
	presignClient := s3.NewPresignClient(s.client)

	switch method {
	case "PUT", "POST":
		input := &s3.PutObjectInput{
			Bucket: aws.String(bucket),
			Key:    aws.String(key),
		}
		req, err := presignClient.PresignPutObject(ctx, input, func(o *s3.PresignOptions) {
			o.Expires = ttl
		})
		if err != nil {
			return "", fmt.Errorf("failed to presign PUT URL: %w", err)
		}
		return req.URL, nil
	default:
		input := &s3.GetObjectInput{
			Bucket: aws.String(bucket),
			Key:    aws.String(key),
		}
		req, err := presignClient.PresignGetObject(ctx, input, func(o *s3.PresignOptions) {
			o.Expires = ttl
		})
		if err != nil {
			return "", fmt.Errorf("failed to presign GET URL: %w", err)
		}
		return req.URL, nil
	}
}

func (s *S3Store) Copy(ctx context.Context, srcBucket, srcKey, dstBucket, dstKey string) error {
	_, err := s.client.CopyObject(ctx, &s3.CopyObjectInput{
		Bucket:     aws.String(dstBucket),
		Key:        aws.String(dstKey),
		CopySource: aws.String(fmt.Sprintf("%s/%s", srcBucket, srcKey)),
	})
	if err != nil {
		return fmt.Errorf("s3 copy failed: %w", err)
	}
	return nil
}

func (s *S3Store) MultipartUpload(ctx context.Context, bucket, key string, opts ...UploadOption) (string, error) {
	output, err := s.client.CreateMultipartUpload(ctx, &s3.CreateMultipartUploadInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return "", fmt.Errorf("s3 multipart create failed: %w", err)
	}
	return aws.ToString(output.UploadId), nil
}

func (s *S3Store) MultipartPart(ctx context.Context, bucket, key, uploadID string, partNum int, r io.Reader) (string, error) {
	data, err := io.ReadAll(r)
	if err != nil {
		return "", fmt.Errorf("failed to read part data: %w", err)
	}

	output, err := s.client.UploadPart(ctx, &s3.UploadPartInput{
		Bucket:     aws.String(bucket),
		Key:        aws.String(key),
		UploadId:   aws.String(uploadID),
		PartNumber: aws.Int32(int32(partNum)),
		Body:       bytes.NewReader(data),
	})
	if err != nil {
		return "", fmt.Errorf("s3 multipart upload part failed: %w", err)
	}
	return aws.ToString(output.ETag), nil
}

func (s *S3Store) MultipartComplete(ctx context.Context, bucket, key, uploadID string, parts []MultipartPart) error {
	var s3Parts []types.CompletedPart
	for _, p := range parts {
		s3Parts = append(s3Parts, types.CompletedPart{
			PartNumber: aws.Int32(int32(p.PartNum)),
			ETag:       aws.String(p.ETag),
		})
	}

	_, err := s.client.CompleteMultipartUpload(ctx, &s3.CompleteMultipartUploadInput{
		Bucket:   aws.String(bucket),
		Key:      aws.String(key),
		UploadId: aws.String(uploadID),
		MultipartUpload: &types.CompletedMultipartUpload{
			Parts: s3Parts,
		},
	})
	if err != nil {
		return fmt.Errorf("s3 multipart complete failed: %w", err)
	}
	return nil
}

// ErrObjectNotFound is returned when a storage object doesn't exist.
var ErrObjectNotFound = errors.New("object not found")