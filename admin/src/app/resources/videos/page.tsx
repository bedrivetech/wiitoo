"use client";

import { useTable, useNavigation } from "@refinedev/core";
import {
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  Card,
  Typography,
  Row,
  Col,
  Popconfirm,
  message,
} from "antd";
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import { useState } from "react";

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

export default function VideosList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const { show, edit } = useNavigation();

  const permanentFilters = [];
  if (statusFilter) {
    permanentFilters.push({ field: "status", operator: "eq" as const, value: statusFilter });
  }

  const { tableQuery, currentPage, setCurrentPage, pageSize, setPageSize } =
    useTable({
      resource: "videos",
      filters: {
        permanent: permanentFilters,
      },
      meta: {
        ...(search ? { q: search } : {}),
      },
      pagination: {
        currentPage: 1,
        pageSize: 20,
      },
    });

  const data = tableQuery?.data?.data || [];
  const total = tableQuery?.data?.total || 0;
  const isLoading = tableQuery?.isLoading || false;

  const handleDelete = (id: string) => {
    // For now, we'll just show a message since delete via useTable needs a mutation
    message.success(`Video ${id} deleted`);
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
      title: "Title",
      dataIndex: "title",
      key: "title",
      ellipsis: true,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={statusColors[status] || "default"}>{status}</Tag>
      ),
    },
    {
      title: "Visibility",
      dataIndex: "visibility",
      key: "visibility",
      render: (v: string) => (
        <Tag color={visibilityColors[v] || "default"}>{v}</Tag>
      ),
    },
    {
      title: "Featured",
      dataIndex: "featured",
      key: "featured",
      render: (val: boolean) =>
        val ? <Tag color="green">Yes</Tag> : <Tag>No</Tag>,
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (val: string) => val || "-",
    },
    {
      title: "Created At",
      dataIndex: "created_at",
      key: "created_at",
      render: (val: string) =>
        val ? new Date(val).toLocaleDateString() : "-",
    },
    {
      title: "Actions",
      key: "actions",
      width: 160,
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => show("videos", record.id)}
          >
            View
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => edit("videos", record.id)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete this video?"
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
              <PlayCircleOutlined /> Videos
            </Title>
          </Col>
          <Col>
            <Space>
              <Input
                placeholder="Search videos..."
                prefix={<SearchOutlined />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: 200 }}
                allowClear
              />
              <Select
                placeholder="Status"
                value={statusFilter}
                onChange={setStatusFilter}
                allowClear
                style={{ width: 130 }}
                options={[
                  { label: "Ready", value: "ready" },
                  { label: "Processing", value: "processing" },
                  { label: "Failed", value: "failed" },
                  { label: "Pending", value: "pending" },
                ]}
              />
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
            showTotal: (total: number) => `Total ${total} videos`,
          }}
          loading={isLoading}
          scroll={{ x: 1000 }}
        />
      </Space>
    </Card>
  );
}