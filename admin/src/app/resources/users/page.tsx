"use client";

import { useTable, useNavigation, useCustomMutation, useApiUrl } from "@refinedev/core";
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
  Modal,
  message,
} from "antd";
import {
  EditOutlined,
  SearchOutlined,
  UserOutlined,
  DownloadOutlined,
  LockOutlined,
  UnlockOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { useState, useCallback } from "react";

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
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [bulkModal, setBulkModal] = useState<{ open: boolean; action: "ban" | "verify" | "role" | "" }>({ open: false, action: "" });
  const [bulkRole, setBulkRole] = useState<string>("viewer");
  const [bulkReason, setBulkReason] = useState("");
  const { edit } = useNavigation();
  const apiUrl = useApiUrl();

  const { mutate: customMutate, mutation: customMutation } = useCustomMutation();
  const isMutating = customMutation?.isPending || false;

  const permanentFilters: any[] = [];
  if (roleFilter) {
    permanentFilters.push({ field: "role", operator: "eq" as const, value: roleFilter });
  }
  if (statusFilter) {
    permanentFilters.push({ field: "status", operator: "eq" as const, value: statusFilter });
  }

  const { tableQuery, currentPage, setCurrentPage, pageSize, setPageSize } =
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

  const handleExportCSV = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (roleFilter) params.set("role", roleFilter);
    if (statusFilter) params.set("status", statusFilter);

    const token = localStorage.getItem("access_token");
    const url = `${apiUrl}/users/export?${params.toString()}`;

    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `users_export_${Date.now()}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
        message.success("CSV exported successfully");
      })
      .catch(() => message.error("Failed to export CSV"));
  }, [search, roleFilter, statusFilter, apiUrl]);

  const handleBulkAction = useCallback(() => {
    if (selectedRowKeys.length === 0) {
      message.warning("No users selected");
      return;
    }

    const { action } = bulkModal;

    if (action === "ban") {
      customMutate(
        {
          url: `${apiUrl}/users/bulk/status`,
          method: "post",
          values: {
            userIDs: selectedRowKeys,
            status: "suspended",
            reason: bulkReason || "Bulk action",
          },
        },
        {
          onSuccess: () => {
            message.success(`${selectedRowKeys.length} users suspended`);
            setBulkModal({ open: false, action: "" });
            setSelectedRowKeys([]);
            setBulkReason("");
            tableQuery?.refetch?.();
          },
          onError: (error: any) => {
            message.error(error?.message || "Bulk action failed");
          },
        }
      );
    } else if (action === "role") {
      customMutate(
        {
          url: `${apiUrl}/users/bulk/role`,
          method: "post",
          values: {
            userIDs: selectedRowKeys,
            role: bulkRole,
          },
        },
        {
          onSuccess: () => {
            message.success(`${selectedRowKeys.length} users role changed to ${bulkRole}`);
            setBulkModal({ open: false, action: "" });
            setSelectedRowKeys([]);
            tableQuery?.refetch?.();
          },
          onError: (error: any) => {
            message.error(error?.message || "Bulk action failed");
          },
        }
      );
    } else if (action === "verify") {
      // Toggle all selected to creator verified
      Promise.all(
        selectedRowKeys.map((id) =>
          fetch(`${apiUrl}/users/${String(id)}/verify`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            },
            body: JSON.stringify({ verified: true }),
          })
        )
      )
        .then(() => {
          message.success(`${selectedRowKeys.length} users verified as creators`);
          setBulkModal({ open: false, action: "" });
          setSelectedRowKeys([]);
          tableQuery?.refetch?.();
        })
        .catch(() => message.error("Bulk verify failed"));
    }
  }, [selectedRowKeys, bulkModal, bulkRole, bulkReason, customMutate, apiUrl, tableQuery]);

  const columns = [
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
      dataIndex: "creator_verified",
      key: "creator_verified",
      render: (val: boolean) =>
        val ? <Tag color="green">Creator ✓</Tag> : <Tag color="default">—</Tag>,
    },
    {
      title: "Email Verified",
      dataIndex: "email_verified_at",
      key: "email_verified",
      render: (val: string | null) =>
        val ? <Tag color="blue">Yes</Tag> : <Tag color="default">No</Tag>,
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
      width: 200,
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

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  };

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
              <Button icon={<DownloadOutlined />} onClick={handleExportCSV}>
                Export CSV
              </Button>
            </Space>
          </Col>
        </Row>

        {selectedRowKeys.length > 0 && (
          <Row>
            <Col>
              <Space>
                <Tag color="blue">{selectedRowKeys.length} selected</Tag>
                <Button
                  size="small"
                  danger
                  icon={<LockOutlined />}
                  onClick={() => setBulkModal({ open: true, action: "ban" })}
                >
                  Suspend Selected
                </Button>
                <Button
                  size="small"
                  icon={<CheckCircleOutlined />}
                  onClick={() => setBulkModal({ open: true, action: "verify" })}
                >
                  Verify as Creators
                </Button>
                <Button
                  size="small"
                  icon={<UnlockOutlined />}
                  onClick={() => setBulkModal({ open: true, action: "role" })}
                >
                  Change Role
                </Button>
              </Space>
            </Col>
          </Row>
        )}

        <Table
          dataSource={data}
          columns={columns}
          rowKey="id"
          rowSelection={rowSelection}
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
          scroll={{ x: 1100 }}
        />

        <Modal
          title={
            bulkModal.action === "ban"
              ? "Suspend Users"
              : bulkModal.action === "verify"
                ? "Verify as Creators"
                : "Change Role"
          }
          open={bulkModal.open}
          onOk={handleBulkAction}
          onCancel={() => {
            setBulkModal({ open: false, action: "" });
            setBulkReason("");
          }}
          confirmLoading={customMutation.isPending}
        >
          <Space direction="vertical" style={{ width: "100%" }}>
            <p>
              {selectedRowKeys.length} user{selectedRowKeys.length !== 1 ? "s" : ""} selected
            </p>
            {bulkModal.action === "ban" && (
              <Input.TextArea
                placeholder="Reason for suspension..."
                value={bulkReason}
                onChange={(e) => setBulkReason(e.target.value)}
                rows={3}
              />
            )}
            {bulkModal.action === "role" && (
              <Select
                value={bulkRole}
                onChange={setBulkRole}
                style={{ width: "100%" }}
                options={[
                  { label: "Viewer", value: "viewer" },
                  { label: "Creator", value: "creator" },
                  { label: "Moderator", value: "moderator" },
                  { label: "Admin", value: "admin" },
                ]}
              />
            )}
          </Space>
        </Modal>
      </Space>
    </Card>
  );
}