"use client";

import { useTable, useDelete } from "@refinedev/core";
import {
  Table,
  Button,
  Space,
  Tag,
  Input,
  Card,
  Typography,
  Row,
  Col,
  Popconfirm,
  message,
  Modal,
  InputNumber,
  Form,
} from "antd";
import {
  DeleteOutlined,
  SearchOutlined,
  MessageOutlined,
  BlockOutlined,
  ClearOutlined,
} from "@ant-design/icons";
import { useState } from "react";

const { Title } = Typography;

export default function ChatMessagesList() {
  const [search, setSearch] = useState("");
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [banUserId, setBanUserId] = useState<string>("");
  const [purgeModalOpen, setPurgeModalOpen] = useState(false);
  const [purgeStreamId, setPurgeStreamId] = useState<string>("");
  const [banDuration, setBanDuration] = useState<number>(60);

  const { tableQuery, currentPage, setCurrentPage, pageSize, setPageSize } =
    useTable({
      resource: "chat-messages",
      meta: {
        ...(search ? { q: search } : {}),
      },
      pagination: {
        currentPage: 1,
        pageSize: 20,
      },
    });

  const { mutate: deleteMessage } = useDelete();

  const data = tableQuery?.data?.data || [];
  const total = tableQuery?.data?.total || 0;
  const isLoading = tableQuery?.isLoading || false;

  const handleDelete = (id: string) => {
    deleteMessage(
      {
        resource: "chat-messages",
        id,
      },
      {
        onSuccess: () => {
          message.success("Message deleted");
        },
        onError: (err: any) => {
          message.error(err?.message || "Failed to delete message");
        },
      }
    );
  };

  const handleChatBan = async () => {
    if (!banUserId) return;
    try {
      const token = localStorage.getItem("access_token");
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const response = await fetch(`${API_BASE}/api/v1/admin/users/${banUserId}/chat-ban`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ duration_minutes: banDuration }),
      });
      const json = await response.json();
      if (json.success) {
        message.success(`User banned from chat for ${banDuration} minutes`);
        setBanModalOpen(false);
        setBanUserId("");
      } else {
        message.error(json.error?.message || "Failed to ban user");
      }
    } catch (err: any) {
      message.error(err.message || "Failed to ban user");
    }
  };

  const handlePurgeStream = async () => {
    if (!purgeStreamId) return;
    try {
      const token = localStorage.getItem("access_token");
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const response = await fetch(`${API_BASE}/api/v1/admin/streams/${purgeStreamId}/purge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await response.json();
      if (json.success) {
        message.success("Chat purged for stream");
        setPurgeModalOpen(false);
        setPurgeStreamId("");
      } else {
        message.error(json.error?.message || "Failed to purge chat");
      }
    } catch (err: any) {
      message.error(err.message || "Failed to purge chat");
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 100,
      render: (id: string) => id?.substring(0, 8) || "-",
    },
    {
      title: "User ID",
      dataIndex: "user_id",
      key: "user_id",
      render: (val: string) => val?.substring(0, 12) || "-",
    },
    {
      title: "Stream ID",
      dataIndex: "stream_id",
      key: "stream_id",
      ellipsis: true,
      render: (val: string) => val?.substring(0, 12) || "-",
    },
    {
      title: "Message",
      dataIndex: "content",
      key: "content",
      ellipsis: true,
      width: 300,
    },
    {
      title: "Created At",
      dataIndex: "created_at",
      key: "created_at",
      render: (val: string) =>
        val ? new Date(val).toLocaleString() : "-",
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_: any, record: any) => (
        <Space>
          <Popconfirm
            title="Delete this message?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button danger size="small" icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card>
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={4} style={{ margin: 0 }}>
                <MessageOutlined /> Chat Messages
              </Title>
            </Col>
            <Col>
              <Space>
                <Input
                  placeholder="Search messages..."
                  prefix={<SearchOutlined />}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ width: 200 }}
                  allowClear
                />
                <Button
                  icon={<BlockOutlined />}
                  onClick={() => setBanModalOpen(true)}
                >
                  Chat Ban User
                </Button>
                <Button
                  icon={<ClearOutlined />}
                  onClick={() => setPurgeModalOpen(true)}
                >
                  Purge Stream Chat
                </Button>
              </Space>
            </Col>
          </Row>

          <Table
            dataSource={data}
            columns={columns}
            rowKey="id"
            pagination={{
              current: currentPage,
              pageSize,
              total,
              onChange: (page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              },
              showSizeChanger: true,
              showTotal: (total: number) => `Total ${total} messages`,
            }}
            loading={isLoading}
            scroll={{ x: 800 }}
          />
        </Space>
      </Card>

      <Modal
        title="Chat Ban User"
        open={banModalOpen}
        onOk={handleChatBan}
        onCancel={() => {
          setBanModalOpen(false);
          setBanUserId("");
        }}
        okText="Ban User"
        okButtonProps={{ danger: true }}
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <div>
            <label>User ID:</label>
            <Input
              value={banUserId}
              onChange={(e) => setBanUserId(e.target.value)}
              placeholder="Enter user ID"
              style={{ marginTop: 4 }}
            />
          </div>
          <div>
            <label>Duration (minutes):</label>
            <InputNumber
              value={banDuration}
              onChange={(val) => setBanDuration(val || 60)}
              min={1}
              max={1440}
              style={{ width: "100%", marginTop: 4 }}
            />
          </div>
        </Space>
      </Modal>

      <Modal
        title="Purge Stream Chat"
        open={purgeModalOpen}
        onOk={handlePurgeStream}
        onCancel={() => {
          setPurgeModalOpen(false);
          setPurgeStreamId("");
        }}
        okText="Purge Chat"
        okButtonProps={{ danger: true }}
      >
        <div>
          <label>Stream ID:</label>
          <Input
            value={purgeStreamId}
            onChange={(e) => setPurgeStreamId(e.target.value)}
            placeholder="Enter stream ID"
            style={{ marginTop: 4 }}
          />
        </div>
      </Modal>
    </>
  );
}