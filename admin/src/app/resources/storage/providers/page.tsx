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
  HddOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";

const { Title } = Typography;

const typeColors: Record<string, string> = {
  wasabi: "blue",
  backblaze: "orange",
  idrive: "green",
  r2: "purple",
  s3: "default",
};

export default function StorageProvidersList() {
  const { edit, create, show } = useNavigation();

  const { tableQuery, currentPage, setCurrentPage, pageSize, setPageSize } =
    useTable({
      resource: "storage/providers",
      pagination: { currentPage: 1, pageSize: 20 },
    });

  const data = tableQuery?.data?.data || [];
  const total = tableQuery?.data?.total || 0;
  const isLoading = tableQuery?.isLoading || false;

  const handleDelete = (id: string) => {
    const token = localStorage.getItem("access_token");
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    fetch(`${API_BASE}/api/v1/admin/storage/providers/${id}`, {
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
          message.success("Provider deleted");
          tableQuery.refetch();
        } else {
          message.error(json.error?.message || "Failed to delete provider");
        }
      })
      .catch((err) => message.error(err.message));
  };

  const handleTest = (id: string) => {
    const token = localStorage.getItem("access_token");
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    fetch(`${API_BASE}/api/v1/admin/storage/providers/${id}/test`, {
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
          message.success("Connection test passed!");
          tableQuery.refetch();
        } else {
          message.error(json.error?.message || "Connection test failed");
        }
      })
      .catch((err) => message.error(err.message));
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: any) => (
        <a onClick={() => show("storage/providers", record.id)}>
          <HddOutlined /> {name}
        </a>
      ),
    },
    {
      title: "Type",
      dataIndex: "providerType",
      key: "providerType",
      render: (type: string) => (
        <Tag color={typeColors[type] || "default"}>{type}</Tag>
      ),
    },
    {
      title: "Region",
      dataIndex: "defaultRegion",
      key: "defaultRegion",
    },
    {
      title: "Endpoint",
      dataIndex: "endpoint",
      key: "endpoint",
      ellipsis: true,
    },
    {
      title: "Status",
      key: "status",
      render: (_: any, record: any) => (
        <Space>
          <Tag color={record.isActive ? "green" : "red"}>
            {record.isActive ? "Active" : "Inactive"}
          </Tag>
          {record.isHealthy ? (
            <Tag icon={<CheckCircleOutlined />} color="success">Healthy</Tag>
          ) : (
            <Tag icon={<CloseCircleOutlined />} color="error">Unhealthy</Tag>
          )}
        </Space>
      ),
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: 80,
    },
    {
      title: "Actions",
      key: "actions",
      width: 220,
      render: (_: any, record: any) => (
        <Space>
          <Button
            size="small"
            onClick={() => handleTest(record.id)}
          >
            Test
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => edit("storage/providers", record.id)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete this provider?"
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
              <HddOutlined /> Storage Providers
            </Title>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => create("storage/providers")}
            >
              Add Provider
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
            showTotal: (total: number) => `Total ${total} providers`,
          }}
          loading={isLoading}
          scroll={{ x: 1000 }}
        />
      </Space>
    </Card>
  );
}