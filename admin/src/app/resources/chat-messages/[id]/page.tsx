"use client";

import { useOne, useDelete, useApiUrl } from "@refinedev/core";
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
  DeleteOutlined,
  MessageOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

export default function ChatMessagesShow() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { query, result: messageData } = useOne({
    resource: "chat-messages",
    id,
  });

  const { mutate: deleteMessage, mutation: deleteMutation } = useDelete();

  const handleDelete = () => {
    deleteMessage(
      {
        resource: "chat-messages",
        id,
      },
      {
        onSuccess: () => {
          message.success("Message deleted successfully");
          router.push("/resources/chat-messages");
        },
        onError: (err: any) => {
          message.error(err?.message || "Failed to delete message");
        },
      }
    );
  };

  const isLoading = query.isLoading;
  const msg = messageData as any;

  if (isLoading) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (!msg) {
    return (
      <Card>
        <Title level={4}>Message not found</Title>
        <Button onClick={() => router.push("/resources/chat-messages")}>
          Back to Chat Messages
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
            onClick={() => router.push("/resources/chat-messages")}
          >
            Back
          </Button>
          <Title level={4} style={{ margin: 0 }}>
            <MessageOutlined /> Chat Message Details
          </Title>
        </Space>

        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="Message ID" span={2}>
            {msg.id}
          </Descriptions.Item>
          <Descriptions.Item label="User ID" span={2}>
            {msg.user_id || msg.userId || "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Username">
            {msg.username || msg.user_name || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Display Name">
            {msg.display_name || msg.displayName || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Channel / Stream ID" span={2}>
            {msg.stream_id || msg.streamId || msg.channel_id || msg.channelId || "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Created At" span={2}>
            {msg.created_at || msg.createdAt
              ? new Date(msg.created_at || msg.createdAt).toLocaleString()
              : "-"}
          </Descriptions.Item>
        </Descriptions>

        <Card
          size="small"
          title="Message Content"
          style={{ background: "#fafafa" }}
        >
          <Text
            style={{
              fontSize: 16,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {msg.content || msg.message || msg.text || "(empty message)"}
          </Text>
        </Card>

        {msg.edited_at && (
          <Text type="secondary">
            Edited at: {new Date(msg.edited_at).toLocaleString()}
          </Text>
        )}

        <Space>
          <Popconfirm
            title="Delete this message?"
            description="This action cannot be undone. The message will be permanently removed."
            onConfirm={handleDelete}
          >
            <Button
              danger
              type="primary"
              icon={<DeleteOutlined />}
              loading={deleteMutation.isPending}
            >
              Delete Message
            </Button>
          </Popconfirm>
        </Space>
      </Space>
    </Card>
  );
}