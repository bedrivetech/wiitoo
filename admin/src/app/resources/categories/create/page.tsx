"use client";

import { useCreate } from "@refinedev/core";
import { useRouter } from "next/navigation";
import {
  Card,
  Form,
  Input,
  Button,
  Space,
  Typography,
  message,
} from "antd";
import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";

const { Title } = Typography;

export default function CategoriesCreate() {
  const router = useRouter();
  const [form] = Form.useForm();
  const { mutate: createCategory, mutation: createMutation } = useCreate();

  const handleFinish = (values: any) => {
    createCategory(
      {
        resource: "categories",
        values,
      },
      {
        onSuccess: () => {
          message.success("Category created successfully");
          router.push("/resources/categories");
        },
        onError: (error: any) => {
          message.error(error?.message || "Failed to create category");
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
            onClick={() => router.push("/resources/categories")}
          >
            Back
          </Button>
          <Title level={4} style={{ margin: 0 }}>
            Create Category
          </Title>
        </Space>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          style={{ maxWidth: 500 }}
        >
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: "Please enter a category name" }]}
          >
            <Input placeholder="Category name" />
          </Form.Item>

          <Form.Item label="Description" name="description">
            <Input.TextArea rows={3} placeholder="Category description" />
          </Form.Item>

          <Form.Item label="Thumbnail URL" name="thumbnail">
            <Input placeholder="https://example.com/thumbnail.jpg" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={createMutation.isPending}
              >
                Create
              </Button>
              <Button onClick={() => router.push("/resources/categories")}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Space>
    </Card>
  );
}