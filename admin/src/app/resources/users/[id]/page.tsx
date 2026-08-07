"use client";

import { useOne, useUpdate, useCustomMutation, useApiUrl } from "@refinedev/core";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Space,
  Typography,
  Spin,
  message,
  Descriptions,
  Tag,
  Divider,
  Table,
  Modal,
  InputNumber,
} from "antd";
import {
  ArrowLeftOutlined,
  SaveOutlined,
  LockOutlined,
  UnlockOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { useState } from "react";

const { Title, Text } = Typography;

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

export default function UsersEdit() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const apiUrl = useApiUrl();
  const [form] = Form.useForm();
  const [banModal, setBanModal] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState("");

  const { query: profileQuery, result: profile } = useOne({
    resource: "users",
    id,
    meta: { apiUrl: `${apiUrl}/users/profile` },
  });

  // Fallback to basic user fetch
  const { query: userQuery, result: user } = useOne({
    resource: "users",
    id,
  });

  const { mutate: update, mutation: updateMutation } = useUpdate();

  const { mutate: customMutate, mutation: customMutation } = useCustomMutation();

  const currentProfile = profile || user;
  const isLoading = profileQuery.isLoading || userQuery.isLoading;
  const isAdminProfile = !!profile;

  const handleFinish = (values: any) => {
    update(
      {
        resource: "users",
        id,
        values,
      },
      {
        onSuccess: () => {
          message.success("User updated successfully");
          router.push("/resources/users");
        },
        onError: (error: any) => {
          message.error(error?.message || "Failed to update user");
        },
      }
    );
  };

  const handleBan = () => {
    customMutate(
      {
        url: `${apiUrl}/users/${id}/ban`,
        method: "post",
        values: {
          reason: banReason,
          duration: banDuration || null,
          note: "",
        },
      },
      {
        onSuccess: () => {
          message.success("User suspended");
          setBanModal(false);
          setBanReason("");
          setBanDuration(undefined);
          router.refresh();
        },
        onError: (error: any) => {
          message.error(error?.message || "Failed to ban user");
        },
      }
    );
  };

  const handleUnban = () => {
    customMutate(
      {
        url: `${apiUrl}/users/${id}/unban`,
        method: "post",
        values: {},
      },
      {
        onSuccess: () => {
          message.success("User unbanned");
          router.refresh();
        },
        onError: (error: any) => {
          message.error(error?.message || "Failed to unban user");
        },
      }
    );
  };

  const handleToggleVerify = () => {
    const newVerified = !(currentProfile as any)?.creator_verified;
    fetch(`${apiUrl}/users/${id}/verify`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
      body: JSON.stringify({ verified: newVerified }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          message.success(`Creator verification ${newVerified ? "enabled" : "disabled"}`);
          router.refresh();
        } else {
          message.error(json.error?.message || "Failed to update verification");
        }
      })
      .catch(() => message.error("Failed to update verification"));
  };

  const handleSaveNotes = () => {
    fetch(`${apiUrl}/users/${id}/notes`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
      body: JSON.stringify({ notes }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          message.success("Notes saved");
        } else {
          message.error(json.error?.message || "Failed to save notes");
        }
      })
      .catch(() => message.error("Failed to save notes"));
  };

  if (isLoading) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  const p = currentProfile as any;
  const isSuspended = p?.status === "suspended";
  const isActive = p?.status === "active";
  const isDeleted = p?.status === "deleted";

  const banHistory = p?.banHistory || [];

  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push("/resources/users")}
          >
            Back
          </Button>
          <Title level={4} style={{ margin: 0 }}>
            Edit User: {p?.email || p?.username || id}
          </Title>
        </Space>

        {/* Account Info Section */}
        <Card size="small" title="Account Information">
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="ID">{p?.id}</Descriptions.Item>
            <Descriptions.Item label="Email">{p?.email}</Descriptions.Item>
            <Descriptions.Item label="Username">{p?.username}</Descriptions.Item>
            <Descriptions.Item label="Display Name">{p?.display_name || "-"}</Descriptions.Item>
            <Descriptions.Item label="Role">
              <Tag color={roleColors[p?.role] || "default"}>{p?.role}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={statusColors[p?.status] || "default"}>{p?.status}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Email Verified">
              {p?.email_verified_at ? (
                <Tag color="blue">Yes ({new Date(p.email_verified_at).toLocaleDateString()})</Tag>
              ) : (
                <Tag color="default">No</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Created At">
              {p?.created_at ? new Date(p.created_at).toLocaleString() : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Updated At">
              {p?.updated_at ? new Date(p.updated_at).toLocaleString() : "-"}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Stats Section (from profile) */}
        {p?.loginCount !== undefined && (
          <Card size="small" title="User Statistics">
            <Descriptions column={4} bordered size="small">
              <Descriptions.Item label="Login Count">{p.loginCount}</Descriptions.Item>
              <Descriptions.Item label="Last Login">
                {p.lastLoginAt ? new Date(p.lastLoginAt).toLocaleString() : "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Last IP">{p.lastIP || "-"}</Descriptions.Item>
              <Descriptions.Item label="Two-Factor">
                {p.twoFactorEnabled ? <Tag color="green">Enabled</Tag> : <Tag color="default">Disabled</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="Total Streams">{p.totalStreams || 0}</Descriptions.Item>
              <Descriptions.Item label="Total Followers">{p.totalFollowers || 0}</Descriptions.Item>
              <Descriptions.Item label="Total Earned">${(p.totalEarned || 0).toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="Creator Verified">
                {p.creatorVerified ? (
                  <Tag color="green">Yes</Tag>
                ) : (
                  <Tag color="default">No</Tag>
                )}
              </Descriptions.Item>
            </Descriptions>
            {p.creatorAppliedAt && (
              <Text type="secondary" style={{ marginTop: 8, display: "block" }}>
                Creator application submitted: {new Date(p.creatorAppliedAt).toLocaleString()}
              </Text>
            )}
          </Card>
        )}

        {/* Creator Verification Section */}
        <Card
          size="small"
          title="Creator Verification"
          extra={
            <Button
              size="small"
              icon={p?.creatorVerified ? <CloseCircleOutlined /> : <CheckCircleOutlined />}
              onClick={handleToggleVerify}
              type={p?.creatorVerified ? "default" : "primary"}
            >
              {p?.creatorVerified ? "Remove Verification" : "Verify as Creator"}
            </Button>
          }
        >
          <Descriptions column={2} size="small">
            <Descriptions.Item label="Status">
              {p?.creatorVerified ? (
                <Tag color="green">Verified</Tag>
              ) : (
                <Tag color="default">Not Verified</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Applied At">
              {p?.creatorAppliedAt ? new Date(p.creatorAppliedAt).toLocaleString() : "-"}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Ban History Section */}
        <Card
          size="small"
          title="Ban / Suspension History"
          extra={
            <Space>
              {isSuspended && (
                <Button
                  size="small"
                  icon={<UnlockOutlined />}
                  onClick={handleUnban}
                  type="primary"
                >
                  Unban
                </Button>
              )}
              {!isDeleted && (
                <Button
                  size="small"
                  icon={<LockOutlined />}
                  onClick={() => setBanModal(true)}
                  danger
                  disabled={isSuspended}
                >
                  {isSuspended ? "Already Suspended" : "Ban / Suspend"}
                </Button>
              )}
            </Space>
          }
        >
          {banHistory.length > 0 ? (
            <Table
              dataSource={banHistory}
              rowKey="id"
              size="small"
              pagination={false}
              columns={[
                { title: "Reason", dataIndex: "reason", key: "reason" },
                { title: "Date", dataIndex: "createdAt", key: "createdAt", render: (v: string) => v ? new Date(v).toLocaleString() : "-" },
                { title: "Duration", dataIndex: "duration", key: "duration", render: (v: number | null) => v ? `${v}h` : "Permanent" },
                { title: "Active", dataIndex: "active", key: "active", render: (v: boolean) => v ? <Tag color="red">Active</Tag> : <Tag color="default">Lifted</Tag> },
                { title: "Removed At", dataIndex: "removedAt", key: "removedAt", render: (v: string) => v ? new Date(v).toLocaleString() : "-" },
              ]}
            />
          ) : (
            <Text type="secondary">No ban history</Text>
          )}
        </Card>

        {/* Notes Section */}
        <Card size="small" title="Admin Notes">
          <Space direction="vertical" style={{ width: "100%" }}>
            <Input.TextArea
              rows={4}
              defaultValue={p?.notes || ""}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Admin notes about this user..."
            />
            <Button onClick={handleSaveNotes} type="primary">
              Save Notes
            </Button>
          </Space>
        </Card>

        <Divider />

        {/* Edit Form */}
        <Title level={5}>Edit Fields</Title>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            display_name: p?.display_name || "",
            role: p?.role || "viewer",
            status: p?.status || "active",
          }}
          onFinish={handleFinish}
          style={{ maxWidth: 500 }}
        >
          <Form.Item label="Display Name" name="display_name">
            <Input placeholder="Display name" />
          </Form.Item>

          <Form.Item label="Role" name="role">
            <Select
              options={[
                { label: "Admin", value: "admin" },
                { label: "Moderator", value: "moderator" },
                { label: "Creator", value: "creator" },
                { label: "Viewer", value: "viewer" },
              ]}
            />
          </Form.Item>

          <Form.Item label="Status" name="status">
            <Select
              options={[
                { label: "Active", value: "active" },
                { label: "Suspended", value: "suspended" },
                { label: "Pending", value: "pending" },
                { label: "Deleted", value: "deleted" },
              ]}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={updateMutation.isPending}
              >
                Save Changes
              </Button>
              <Button onClick={() => router.push("/resources/users")}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>

        {/* Ban Modal */}
        <Modal
          title="Suspend User"
          open={banModal}
          onOk={handleBan}
          onCancel={() => {
            setBanModal(false);
            setBanReason("");
            setBanDuration(undefined);
          }}
          confirmLoading={customMutation.isPending}
          okText="Suspend"
          okButtonProps={{ danger: true }}
        >
          <Space direction="vertical" style={{ width: "100%" }}>
            <Text>Reason for suspension:</Text>
            <Input.TextArea
              placeholder="Enter reason..."
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              rows={3}
            />
            <Text>Duration (hours, leave empty for permanent):</Text>
            <InputNumber
              placeholder="Hours"
              value={banDuration}
              onChange={(v) => setBanDuration(v ?? undefined)}
              min={1}
              style={{ width: "100%" }}
            />
          </Space>
        </Modal>
      </Space>
    </Card>
  );
}