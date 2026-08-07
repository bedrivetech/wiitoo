"use client";

import { useOne, useUpdate, useApiUrl } from "@refinedev/core";
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
  Switch,
  DatePicker,
  message,
  Divider,
  Tag,
} from "antd";
import {
  ArrowLeftOutlined,
  SaveOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title } = Typography;

export default function UsersEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const apiUrl = useApiUrl();
  const [form] = Form.useForm();

  const { query, result: user } = useOne({
    resource: "users",
    id,
  });

  const { mutate: update, mutation: updateMutation } = useUpdate();

  const handleFinish = (values: any) => {
    const payload: Record<string, any> = { ...values };
    if (payload.suspended_until) {
      payload.suspended_until = payload.suspended_until.toISOString();
    }
    update(
      {
        resource: "users",
        id,
        values: payload,
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

  const handleToggleVerify = () => {
    const newVerified = !(user as any)?.creator_verified;
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
          query.refetch?.();
        } else {
          message.error(json.error?.message || "Failed to update verification");
        }
      })
      .catch(() => message.error("Failed to update verification"));
  };

  const isLoading = query.isLoading;
  const u = user as any;

  if (isLoading) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

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
            Edit User: {u?.username || u?.email || id}
          </Title>
          <Tag>{u?.id?.substring(0, 8)}</Tag>
        </Space>

        <Form
          form={form}
          layout="vertical"
          initialValues={{
            username: u?.username || "",
            email: u?.email || "",
            role: u?.role || "viewer",
            display_name: u?.display_name || "",
            suspended: u?.status === "suspended" || false,
            suspension_reason: u?.suspension_reason || "",
            suspended_until: u?.suspended_until ? dayjs(u.suspended_until) : null,
            creator_verified: u?.creator_verified || false,
          }}
          onFinish={handleFinish}
          style={{ maxWidth: 600 }}
        >
          <Divider >Basic Information</Divider>

          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: true, message: "Please enter a username" }]}
          >
            <Input placeholder="Username" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Please enter an email" },
              { type: "email", message: "Invalid email format" },
            ]}
          >
            <Input placeholder="Email address" />
          </Form.Item>

          <Form.Item label="Display Name" name="display_name">
            <Input placeholder="Display name" />
          </Form.Item>

          <Form.Item
            label="Role"
            name="role"
            rules={[{ required: true, message: "Please select a role" }]}
          >
            <Select
              options={[
                { label: "User", value: "user" },
                { label: "Creator", value: "creator" },
                { label: "Moderator", value: "moderator" },
                { label: "Admin", value: "admin" },
              ]}
            />
          </Form.Item>

          <Divider >Suspension</Divider>

          <Form.Item label="Suspended" name="suspended" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item label="Suspension Reason" name="suspension_reason">
            <Input.TextArea rows={3} placeholder="Reason for suspension..." />
          </Form.Item>

          <Form.Item label="Suspended Until" name="suspended_until">
            <DatePicker
              showTime
              style={{ width: "100%" }}
              placeholder="Leave empty for permanent"
            />
          </Form.Item>

          <Divider >Verification</Divider>

          <Form.Item label="Creator Verified" name="creator_verified" valuePropName="checked">
            <Switch />
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
              <Button
                icon={<CheckCircleOutlined />}
                onClick={handleToggleVerify}
              >
                Toggle Creator Verify Badge
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Space>
    </Card>
  );
}