"use client";

import { useOne, useUpdate } from "@refinedev/core";
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
} from "antd";
import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";

const { Title } = Typography;

export default function UsersEdit() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [form] = Form.useForm();

  const { query, result } = useOne({
    resource: "users",
    id,
  });

  const { mutate: update, mutation: updateMutation } = useUpdate();

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

  const user = result;
  const isLoading = query.isLoading;

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
            Edit User: {user?.email || user?.username || id}
          </Title>
        </Space>

        <Form
          form={form}
          layout="vertical"
          initialValues={{
            display_name: user?.display_name || "",
            role: user?.role || "viewer",
            status: user?.status || "active",
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
      </Space>
    </Card>
  );
}