"use client";

import { useCreate } from "@refinedev/core";
import { useRouter } from "next/navigation";
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Space,
  Typography,
  message,
} from "antd";
import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";

const { Title } = Typography;

export default function UsersCreate() {
  const router = useRouter();
  const [form] = Form.useForm();
  const { mutate: createUser, mutation: createMutation } = useCreate();

  const handleFinish = (values: any) => {
    createUser(
      {
        resource: "users",
        values,
      },
      {
        onSuccess: () => {
          message.success("User created successfully");
          router.push("/resources/users");
        },
        onError: (error: any) => {
          message.error(error?.message || "Failed to create user");
        },
      }
    );
  };

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
            Create User
          </Title>
        </Space>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          style={{ maxWidth: 500 }}
        >
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
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input placeholder="user@example.com" />
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
                { label: "Viewer", value: "viewer" },
                { label: "Moderator", value: "moderator" },
                { label: "Creator", value: "creator" },
                { label: "Admin", value: "admin" },
              ]}
            />
          </Form.Item>

          <Form.Item
            label="Status"
            name="status"
            rules={[{ required: true, message: "Please select a status" }]}
          >
            <Select
              options={[
                { label: "Active", value: "active" },
                { label: "Suspended", value: "suspended" },
                { label: "Pending", value: "pending" },
              ]}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={createMutation.isPending}
              >
                Create User
              </Button>
              <Button onClick={() => router.push("/resources/users")}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Space>
    </Card>
  );
}