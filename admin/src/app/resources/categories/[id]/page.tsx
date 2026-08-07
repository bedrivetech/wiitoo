"use client";

import { useOne, useCustomMutation, useApiUrl } from "@refinedev/core";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Typography,
  Spin,
  message,
  Popconfirm,
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  TagOutlined,
} from "@ant-design/icons";

const { Title } = Typography;

const activeColors: Record<string, string> = {
  true: "green",
  false: "default",
};

export default function CategoriesShow() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const apiUrl = useApiUrl();

  const { query, result: category } = useOne({
    resource: "categories",
    id,
  });

  const handleDelete = () => {
    const token = localStorage.getItem("access_token");
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    fetch(`${API_BASE}/api/v1/admin/categories/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          message.success("Category deleted");
          router.push("/resources/categories");
        } else {
          message.error(json.error?.message || "Failed to delete category");
        }
      })
      .catch((err) => {
        message.error(err.message || "Failed to delete category");
      });
  };

  const isLoading = query.isLoading;
  const c = category as any;

  if (isLoading) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (!c) {
    return (
      <Card>
        <Title level={4}>Category not found</Title>
        <Button onClick={() => router.push("/resources/categories")}>
          Back to Categories
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
            onClick={() => router.push("/resources/categories")}
          >
            Back
          </Button>
          <Title level={4} style={{ margin: 0 }}>
            <TagOutlined /> Category: {c.name || id}
          </Title>
        </Space>

        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="ID" span={2}>
            {c.id}
          </Descriptions.Item>
          <Descriptions.Item label="Name" span={2}>
            <Title level={5} style={{ margin: 0 }}>{c.name}</Title>
          </Descriptions.Item>
          <Descriptions.Item label="Description" span={2}>
            {c.description || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Sort Order">
            {c.sort_order ?? 0}
          </Descriptions.Item>
          <Descriptions.Item label="Active">
            <Tag color={activeColors[String(c.active)]}>
              {c.active ? "Yes" : "No"}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Parent Category">
            {c.parent_category_id ? c.parent_category_id.substring(0, 12) : "None"}
          </Descriptions.Item>
          <Descriptions.Item label="Thumbnail">
            {c.thumbnail ? (
              <a href={c.thumbnail} target="_blank" rel="noopener noreferrer">
                View Image
              </a>
            ) : (
              "-"
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Created At">
            {c.created_at ? new Date(c.created_at).toLocaleString() : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Updated At">
            {c.updated_at ? new Date(c.updated_at).toLocaleString() : "-"}
          </Descriptions.Item>
        </Descriptions>

        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => router.push(`/resources/categories/${id}/edit`)}
          >
            Edit Category
          </Button>
          <Popconfirm
            title="Delete this category?"
            onConfirm={handleDelete}
          >
            <Button danger icon={<DeleteOutlined />}>
              Delete Category
            </Button>
          </Popconfirm>
        </Space>
      </Space>
    </Card>
  );
}