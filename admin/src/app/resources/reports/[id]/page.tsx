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
  Divider,
  Input,
  Popconfirm,
} from "antd";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  FlagOutlined,
} from "@ant-design/icons";
import { useState } from "react";

const { Title, Text } = Typography;

const statusColors: Record<string, string> = {
  pending: "gold",
  resolved: "green",
  dismissed: "default",
};

const reportTypeColors: Record<string, string> = {
  spam: "red",
  harassment: "orange",
  inappropriate: "purple",
  copyright: "blue",
  other: "default",
};

const contentTypes: Record<string, string> = {
  video: "blue",
  stream: "cyan",
  comment: "green",
  user: "orange",
};

export default function ReportsShow() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const apiUrl = useApiUrl();
  const [notes, setNotes] = useState("");

  const { query, result: report } = useOne({
    resource: "reports",
    id,
  });

  const { mutate: customMutate, mutation: customMutation } = useCustomMutation();

  const handleApprove = () => {
    customMutate(
      {
        url: `${apiUrl}/reports/${id}`,
        method: "patch",
        values: { status: "resolved", moderation_notes: notes },
      },
      {
        onSuccess: () => {
          message.success("Report approved and resolved");
          query.refetch?.();
        },
        onError: (error: any) => {
          message.error(error?.message || "Failed to approve report");
        },
      }
    );
  };

  const handleDismiss = () => {
    customMutate(
      {
        url: `${apiUrl}/reports/${id}`,
        method: "patch",
        values: { status: "dismissed", moderation_notes: notes },
      },
      {
        onSuccess: () => {
          message.success("Report dismissed");
          query.refetch?.();
        },
        onError: (error: any) => {
          message.error(error?.message || "Failed to dismiss report");
        },
      }
    );
  };

  const handleBanUser = async () => {
    try {
      const targetUserId = (report as any)?.target_user_id;
      if (!targetUserId) {
        message.error("No target user to ban");
        return;
      }
      const token = localStorage.getItem("access_token");
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const response = await fetch(`${API_BASE}/api/v1/admin/users/${targetUserId}/ban`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: notes || "Report violation" }),
      });
      const json = await response.json();
      if (json.success) {
        message.success("User has been banned");
        handleApprove();
      } else {
        message.error(json.error?.message || "Failed to ban user");
      }
    } catch (err: any) {
      message.error(err.message || "Failed to ban user");
    }
  };

  const handleWarnUser = async () => {
    try {
      const targetUserId = (report as any)?.target_user_id;
      if (!targetUserId) {
        message.error("No target user to warn");
        return;
      }
      const token = localStorage.getItem("access_token");
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const response = await fetch(`${API_BASE}/api/v1/admin/users/${targetUserId}/warn`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: notes || "Reported content violation" }),
      });
      const json = await response.json();
      if (json.success) {
        message.success("User has been warned");
        handleApprove();
      } else {
        message.error(json.error?.message || "Failed to warn user");
      }
    } catch (err: any) {
      message.error(err.message || "Failed to warn user");
    }
  };

  const handleDeleteContent = async () => {
    try {
      const r = report as any;
      const token = localStorage.getItem("access_token");
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const type = r?.content_type || "video";
      const targetId = r?.target_id;
      if (!targetId) {
        message.error("No content to delete");
        return;
      }
      const response = await fetch(`${API_BASE}/api/v1/admin/${type}s/${targetId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await response.json();
      if (json.success) {
        message.success(`${type} deleted successfully`);
        handleApprove();
      } else {
        message.error(json.error?.message || "Failed to delete content");
      }
    } catch (err: any) {
      message.error(err.message || "Failed to delete content");
    }
  };

  const isLoading = query.isLoading;
  const r = report as any;

  if (isLoading) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (!r) {
    return (
      <Card>
        <Title level={4}>Report not found</Title>
        <Button onClick={() => router.push("/resources/reports")}>
          Back to Reports
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
            onClick={() => router.push("/resources/reports")}
          >
            Back
          </Button>
          <Title level={4} style={{ margin: 0 }}>
            <FlagOutlined /> Report Details
          </Title>
          <Tag color={statusColors[r.status]}>{r.status}</Tag>
        </Space>

        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="Report ID" span={2}>
            {r.id}
          </Descriptions.Item>
          <Descriptions.Item label="Content Type">
            <Tag color={contentTypes[r.content_type] || "default"}>
              {r.content_type}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Report Type">
            <Tag color={reportTypeColors[r.type] || "default"}>{r.type}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Reporter ID">
            {r.reporter_id?.substring(0, 12) || "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Target ID">
            {r.target_id?.substring(0, 12) || "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Target User ID">
            {r.target_user_id?.substring(0, 12) || "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Reason" span={2}>
            {r.reason || "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Description" span={2}>
            {r.description || "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Created At">
            {r.created_at ? new Date(r.created_at).toLocaleString() : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Updated At">
            {r.updated_at ? new Date(r.updated_at).toLocaleString() : "-"}
          </Descriptions.Item>
        </Descriptions>

        <Divider />

        <div>
          <Text strong style={{ fontSize: 16 }}>
            Moderation Actions
          </Text>
        </div>

        <Input.TextArea
          rows={3}
          placeholder="Moderation notes (will be attached to this action)..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          style={{ maxWidth: 600 }}
        />

        <Space wrap>
          <Popconfirm
            title="Approve this report?"
            description="Mark the report as resolved."
            onConfirm={handleApprove}
          >
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              loading={customMutation.isPending}
            >
              Approve Report
            </Button>
          </Popconfirm>

          <Popconfirm
            title="Dismiss this report?"
            description="Mark the report as dismissed (no action taken)."
            onConfirm={handleDismiss}
          >
            <Button
              icon={<CloseCircleOutlined />}
              loading={customMutation.isPending}
            >
              Dismiss Report
            </Button>
          </Popconfirm>

          <Popconfirm
            title="Delete this content?"
            description={`This will permanently delete the ${r?.content_type || "content"}.`}
            onConfirm={handleDeleteContent}
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              loading={customMutation.isPending}
            >
              Delete Content
            </Button>
          </Popconfirm>

          <Popconfirm
            title="Ban the reported user?"
            description="This will permanently suspend the user's account."
            onConfirm={handleBanUser}
          >
            <Button
              danger
              icon={<ExclamationCircleOutlined />}
              loading={customMutation.isPending}
            >
              Ban User
            </Button>
          </Popconfirm>

          <Popconfirm
            title="Warn the reported user?"
            description="Send a warning to the user without banning."
            onConfirm={handleWarnUser}
          >
            <Button
              icon={<ExclamationCircleOutlined />}
              loading={customMutation.isPending}
            >
              Warn User
            </Button>
          </Popconfirm>
        </Space>
      </Space>
    </Card>
  );
}