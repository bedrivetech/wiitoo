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
  FileTextOutlined,
} from "@ant-design/icons";

const { Title } = Typography;

const typeColors: Record<string, string> = {
  email: "blue",
  push: "purple",
  sms: "green",
  in_app: "orange",
};

export default function TemplatesList() {
  const { edit, create } = useNavigation();

  const { tableQuery, currentPage, setCurrentPage, pageSize, setPageSize } =
    useTable({
      resource: "templates",
      pagination: {
        currentPage: 1,
        pageSize: 20,
      },
    });

  const data = tableQuery?.data?.data || [];
  const total = tableQuery?.data?.total || 0;
  const isLoading = tableQuery?.isLoading || false;

  const handleDelete = (id: string) => {
    const token = localStorage.getItem("access_token");
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    fetch(`${API_BASE}/api/v1/admin/templates/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          message.success("Template deleted");
          tableQuery.refetch();
        } else {
          message.error(json.error?.message || "Failed to delete template");
        }
      })
      .catch((err) => {
        message.error(err.message || "Failed to delete template");
      });
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
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Subject",
      dataIndex: "subject",
      key: "subject",
      ellipsis: true,
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type: string) => (
        <Tag color={typeColors[type] || "default"}>{type}</Tag>
      ),
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
      width: 140,
      render: (_: any, record: any) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => edit("templates", record.id)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete this template?"
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
              <FileTextOutlined /> Notification Templates
            </Title>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => create("templates")}
            >
              Add Template
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
            showTotal: (total: number) => `Total ${total} templates`,
          }}
          loading={isLoading}
          scroll={{ x: 800 }}
        />
      </Space>
    </Card>
  );
}