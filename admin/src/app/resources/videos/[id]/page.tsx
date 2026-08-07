"use client";

import { useOne, useDelete } from "@refinedev/core";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Typography,
  Spin,
  Popconfirm,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

const { Title } = Typography;

const statusColors: Record<string, string> = {
  ready: "green",
  processing: "blue",
  failed: "red",
  pending: "gold",
  deleted: "default",
};

const visibilityColors: Record<string, string> = {
  public: "green",
  private: "red",
  unlisted: "orange",
};

export default function VideosShow() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { query, result } = useOne({
    resource: "videos",
    id,
  });

  const { mutate: deleteVideo, mutation: deleteMutation } = useDelete();

  const handleDelete = () => {
    deleteVideo(
      {
        resource: "videos",
        id,
      },
      {
        onSuccess: () => {
          message.success("Video deleted successfully");
          router.push("/resources/videos");
        },
        onError: (error: any) => {
          message.error(error?.message || "Failed to delete video");
        },
      }
    );
  };

  const video = result;
  const isLoading = query.isLoading;

  if (isLoading) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (!video) {
    return (
      <Card>
        <Title level={4}>Video not found</Title>
        <Button onClick={() => router.push("/resources/videos")}>
          Back to Videos
        </Button>
      </Card>
    );
  }

  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push("/resources/videos")}
          >
            Back
          </Button>
          <Title level={4} style={{ margin: 0 }}>
            Video Details
          </Title>
        </Space>

        <Descriptions bordered column={2}>
          <Descriptions.Item label="ID" span={2}>
            {video.id}
          </Descriptions.Item>
          <Descriptions.Item label="Title" span={2}>
            {video.title}
          </Descriptions.Item>
          <Descriptions.Item label="Description" span={2}>
            {video.description || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={statusColors[video.status] || "default"}>
              {video.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Visibility">
            <Tag color={visibilityColors[video.visibility] || "default"}>
              {video.visibility}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Featured">
            {video.featured ? <Tag color="green">Yes</Tag> : "No"}
          </Descriptions.Item>
          <Descriptions.Item label="Category">
            {video.category || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Creator" span={2}>
            {video.creator_id || "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Duration">
            {video.duration ? `${video.duration}s` : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Views">
            {video.view_count ?? 0}
          </Descriptions.Item>
          <Descriptions.Item label="Created At">
            {video.created_at
              ? new Date(video.created_at).toLocaleString()
              : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Updated At">
            {video.updated_at
              ? new Date(video.updated_at).toLocaleString()
              : "-"}
          </Descriptions.Item>
        </Descriptions>

        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => router.push(`/resources/videos/${id}/edit`)}
          >
            Edit Video
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this video?"
            onConfirm={handleDelete}
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              loading={deleteMutation.isPending}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      </Space>
    </Card>
  );
}