"use client";

import { useTable, useNavigation } from "@refinedev/core";
import {
  Table,
  Button,
  Space,
  Tag,
  Card,
  Typography,
  Row,
  Col,
  Popconfirm,
  message,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  FolderOutlined,
} from "@ant-design/icons";

const { Title } = Typography;

const usageColors: Record<string, string> = {
  video: "blue",
  thumbnail: "green",
  backup: "orange",
  general: "default",
};

export default function StorageBucketsList() {
  const { edit, create, show } = useNavigation();

  const { tableQuery, currentPage, setCurrentPage, pageSize, setPageSize } =
    useTable({
      resource: "storage/buckets",
      pagination: { currentPage: 1, pageSize: 20 },
    });

  const data = tableQuery?.data?.data || [];
  const total = tableQuery?.data?.total || 0;
  const isLoading = tableQuery?.isLoading || false;

  const handleDelete = (id: string) => {
    const token = localStorage.getItem("access_token");
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    fetch(`${API_BASE}/api/v1/admin/storage/buckets/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-User-Role": "admin",
      },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          message.success("Bucket deleted");
          tableQuery.refetch();
        } else {
          message.error(json.error?.message || "Failed to delete bucket");
        }
      })
      .catch((err) => message.error(err.message));
  };

  const handleSync = (id: string) => {
    const token = localStorage.getItem("access_token");
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    fetch(`${API_BASE}/api/v1/admin/storage/buckets/${id}/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-User-Role": "admin",
      },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          message.success("Usage synced");
          tableQuery.refetch();
        } else {
          message.error(json.error?.message || "Failed to sync");
        }
      })
      .catch((err) => message.error(err.message));
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "displayName",
      key: "displayName",
      render: (name: string, record: any) => (
        <a onClick={() => show("storage/buckets", record.id)}>
          <FolderOutlined /> {name}
        </a>
      ),
    },
    {
      title: "Bucket Name",
      dataIndex: "name",
      key: "name",
      ellipsis: true,
    },
    {
      title: "Usage",
      dataIndex: "usage",
      key: "usage",
      render: (usage: string) => (
        <Tag color={usageColors[usage] || "default"}>{usage}</Tag>
      ),
    },
    {
      title: "Region",
      dataIndex: "region",
      key: "region",
    },
    {
      title: "Used / Max",
      key: "size",
      render: (_: any, record: any) => (
        <span>
          {record.usedSizeGB} GB / {record.maxSizeGB > 0 ? `${record.maxSizeGB} GB` : "Unlimited"}
        </span>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (_: any, record: any) => (
        <Tag color={record.isActive ? "green" : "red"}>
          {record.isActive ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 220,
      render: (_: any, record: any) => (
        <Space>
          <Button size="small" onClick={() => handleSync(record.id)}>
            Sync
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => edit("storage/buckets", record.id)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete this bucket?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              <FolderOutlined /> Storage Buckets
            </Title>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => create("storage/buckets")}
            >
              Add Bucket
            </Button>
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
            showTotal: (total: number) => `Total ${total} buckets`,
          }}
          loading={isLoading}
          scroll={{ x: 1000 }}
        />
      </Space>
    </Card>
  );
}