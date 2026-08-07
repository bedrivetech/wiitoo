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
} from "antd";
import {
  EditOutlined,
  SearchOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useState } from "react";

const { Title } = Typography;

const roleColors: Record<string, string> = {
  admin: "red",
  moderator: "orange",
  creator: "blue",
  viewer: "default",
};

const statusColors: Record<string, string> = {
  active: "green",
  suspended: "red",
  pending: "gold",
  deleted: "default",
};

export default function UsersList() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const { edit } = useNavigation();

  const permanentFilters = [];
  if (roleFilter) {
    permanentFilters.push({ field: "role", operator: "eq" as const, value: roleFilter });
  }
  if (statusFilter) {
    permanentFilters.push({ field: "status", operator: "eq" as const, value: statusFilter });
  }

  const { tableQuery, currentPage, setCurrentPage, pageSize, setPageSize, pageCount } =
    useTable({
      resource: "users",
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

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 100,
      render: (id: string) => id?.substring(0, 8) || "-",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
    },
    {
      title: "Display Name",
      dataIndex: "display_name",
      key: "display_name",
      render: (val: string) => val || "-",
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role: string) => (
        <Tag color={roleColors[role] || "default"}>{role}</Tag>
      ),
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
      title: "Verified",
      dataIndex: "verified",
      key: "verified",
      render: (val: boolean) =>
        val ? <Tag color="green">Yes</Tag> : <Tag color="default">No</Tag>,
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
      width: 100,
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => edit("users", record.id)}
          >
            Edit
          </Button>
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
              <UserOutlined /> Users
            </Title>
          </Col>
          <Col>
            <Space>
              <Input
                placeholder="Search users..."
                prefix={<SearchOutlined />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: 200 }}
                allowClear
              />
              <Select
                placeholder="Role"
                value={roleFilter}
                onChange={setRoleFilter}
                allowClear
                style={{ width: 130 }}
                options={[
                  { label: "Admin", value: "admin" },
                  { label: "Moderator", value: "moderator" },
                  { label: "Creator", value: "creator" },
                  { label: "Viewer", value: "viewer" },
                ]}
              />
              <Select
                placeholder="Status"
                value={statusFilter}
                onChange={setStatusFilter}
                allowClear
                style={{ width: 130 }}
                options={[
                  { label: "Active", value: "active" },
                  { label: "Suspended", value: "suspended" },
                  { label: "Pending", value: "pending" },
                  { label: "Deleted", value: "deleted" },
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
            pageSize: pageSize,
            total: total,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            },
            showSizeChanger: true,
            showTotal: (total: number) => `Total ${total} users`,
          }}
          loading={isLoading}
          scroll={{ x: 900 }}
        />
      </Space>
    </Card>
  );
}