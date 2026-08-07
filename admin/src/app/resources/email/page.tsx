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
  MailOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { useState } from "react";

const { Title } = Typography;

const typeColors: Record<string, string> = {
  brevo: "blue",
  sendpulse: "purple",
  smtp: "orange",
  console: "default",
};

const statusColors: Record<string, string> = {
  true: "green",
  false: "red",
};

export default function EmailProvidersPage() {
  const { edit, create, show } = useNavigation();

  const { tableQuery, currentPage, setCurrentPage, pageSize, setPageSize } =
    useTable({
      resource: "email/providers",
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
    fetch(`${API_BASE}/api/v1/admin/email/providers/${id}`, {
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
      .catch((err) => {
        message.error(err.message || "Failed to delete provider");
      });
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
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
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: 80,
    },
    {
      title: "Status",
      key: "status",
      render: (_: any, record: any) => (
        <Space>
          <Tag color={record.isActive ? "green" : "red"}>
            {record.isActive ? "Active" : "Inactive"}
          </Tag>
          <Tag color={record.isHealthy ? "green" : "red"}>
            {record.isHealthy ? "Healthy" : "Unhealthy"}
          </Tag>
        </Space>
      ),
    },
    {
      title: "From",
      key: "from",
      render: (_: any, record: any) =>
        `${record.fromName} <${record.fromEmail}>`,
      ellipsis: true,
    },
    {
      title: "Actions",
      key: "actions",
      width: 180,
      render: (_: any, record: any) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => edit("email/providers", record.id)}
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
              <MailOutlined /> Email Providers
            </Title>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => create("email/providers")}
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
          scroll={{ x: 900 }}
        />
      </Space>
    </Card>
  );
}