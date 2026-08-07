"use client";

import { useOne } from "@refinedev/core";
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
  Modal,
} from "antd";
import {
  ArrowLeftOutlined,
  StopOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useState } from "react";

const { Title, Text } = Typography;

const statusColors: Record<string, string> = {
  live: "red",
  ended: "default",
  scheduled: "blue",
  idle: "orange",
};

export default function StreamsShow() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [banModalOpen, setBanModalOpen] = useState(false);

  const { query, result: stream } = useOne({
    resource: "streams",
    id,
  });
  const isLoading = query.isLoading;

  const handleKillStream = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const response = await fetch(`${API_BASE}/api/v1/admin/streams/${id}/kill`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await response.json();
      if (json.success) {
        message.success("Stream has been killed");
      } else {
        message.error(json.error?.message || "Failed to kill stream");
      }
    } catch (err: any) {
      message.error(err.message || "Failed to kill stream");
    }
  };

  const handleStreamBan = async (userId: string) => {
    try {
      const token = localStorage.getItem("access_token");
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const response = await fetch(`${API_BASE}/api/v1/admin/users/${userId}/stream-ban`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await response.json();
      if (json.success) {
        message.success("User banned from streaming");
        setBanModalOpen(false);
      } else {
        message.error(json.error?.message || "Failed to ban user");
      }
    } catch (err: any) {
      message.error(err.message || "Failed to ban user");
    }
  };



  if (isLoading) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (!stream) {
    return (
      <Card>
        <Title level={4}>Stream not found</Title>
        <Button onClick={() => router.push("/resources/streams")}>
          Back to Streams
        </Button>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push("/resources/streams")}
            >
              Back
            </Button>
            <Title level={4} style={{ margin: 0 }}>
              Stream Details
            </Title>
          </Space>

          <Descriptions bordered column={2}>
            <Descriptions.Item label="ID" span={2}>
              {stream.id}
            </Descriptions.Item>
            <Descriptions.Item label="Title" span={2}>
              {stream.title}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={statusColors[stream.status] || "default"}>
                {stream.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Viewer Count">
              {stream.viewer_count ?? 0}
            </Descriptions.Item>
            <Descriptions.Item label="User ID" span={2}>
              {stream.user_id || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Started At">
              {stream.started_at
                ? new Date(stream.started_at).toLocaleString()
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Ended At">
              {stream.ended_at
                ? new Date(stream.ended_at).toLocaleString()
                : "-"}
            </Descriptions.Item>
          </Descriptions>

          <div>
            <Text strong style={{ fontSize: 16 }}>Actions</Text>
            <br /><br />
            <Space>
              <Popconfirm
                title="Kill this stream?"
                description="This will forcefully end the stream."
                onConfirm={handleKillStream}
              >
                <Button
                  danger
                  icon={<StopOutlined />}
                  disabled={stream.status !== "live"}
                >
                  Kill Stream
                </Button>
              </Popconfirm>

              <Button
                icon={<WarningOutlined />}
                onClick={() => setBanModalOpen(true)}
                disabled={!stream.user_id}
              >
                Ban User from Streaming
              </Button>
            </Space>
          </div>
        </Space>
      </Card>

      <Modal
        title="Confirm Stream Ban"
        open={banModalOpen}
        onOk={() => handleStreamBan(stream.user_id)}
        onCancel={() => setBanModalOpen(false)}
        okText="Yes, Ban User"
        okButtonProps={{ danger: true }}
      >
        <p>
          Are you sure you want to ban user <strong>{stream.user_id}</strong>{" "}
          from streaming?
        </p>
        <p>This will prevent them from creating new streams.</p>
      </Modal>
    </>
  );
}