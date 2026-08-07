"use client";

import { useTable, useNavigation } from "@refinedev/core";
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
} from "antd";
import {
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  MailOutlined,
} from "@ant-design/icons";
import { useState } from "react";

const { Title } = Typography;

const typeColors: Record<string, string> = {
  brevo: "blue",
  sendpulse: "purple",
  smtp: "orange",
  console: "default",
};

export default function EmailProvidersList() {
  const { edit, create, show } = useNavigation();
  const [search, setSearch] = useState("");

  const { tableQuery, currentPage, setCurrentPage, pageSize, setPageSize } = useTable({
    resource: "email/providers",
    pagination: { currentPage: 1, pageSize: 20 },
  });

  const providers = tableQuery?.data?.data || [];
  const total = tableQuery?.data?.total || 0;

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: any) => (
        <a onClick={() => show("email/providers", record.id)}>
          <MailOutlined /> {name}
        </a>
      ),
    },
    {
      title: "Type",
      dataIndex: "providerType",
      key: "providerType",
      render: (t: string) => <Tag color={typeColors[t] || "default"}>{t}</Tag>,
    },
    {
      title: "From",
      key: "from",
      render: (_: any, r: any) => `${r.fromName} <${r.fromEmail}>`,
    },
    {
      title: "Status",
      key: "status",
      render: (_: any, r: any) => (
        <Space>
          <Tag color={r.isActive ? "green" : "red"}>
            {r.isActive ? "Active" : "Inactive"}
          </Tag>
          {r.isHealthy ? (
            <Tag icon={<CheckCircleOutlined />} color="success">
              Healthy
            </Tag>
          ) : (
            <Tag icon={<CloseCircleOutlined />} color="error">
              Unhealthy
            </Tag>
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
      width: 100,
      render: (_: any, record: any) => (
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={() => edit("email/providers", record.id)}
        />
      ),
    },
  ];

  return (
    <Card>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={4}>
            <MailOutlined /> Email Providers
          </Title>
        </Col>
        <Col>
          <Space>
            <Input
              placeholder="Search providers..."
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 250 }}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => create("email/providers")}
            >
              Add Provider
            </Button>
          </Space>
        </Col>
      </Row>

      <Table
        dataSource={providers.filter((p: any) =>
          !search || p.name?.toLowerCase().includes(search.toLowerCase())
        )}
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
        }}
      />
    </Card>
  );
}