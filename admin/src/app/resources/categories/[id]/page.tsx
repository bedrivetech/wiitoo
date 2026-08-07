"use client";

import { useOne, useUpdate } from "@refinedev/core";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  Form,
  Input,
  Button,
  Space,
  Typography,
  Spin,
  message,
} from "antd";
import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";

const { Title } = Typography;

export default function CategoriesEdit() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [form] = Form.useForm();

  const { query, result } = useOne({
    resource: "categories",
    id,
  });

  const { mutate: update, mutation: updateMutation } = useUpdate();

  const handleFinish = (values: any) => {
    update(
      {
        resource: "categories",
        id,
        values,
      },
      {
        onSuccess: () => {
          message.success("Category updated successfully");
          router.push("/resources/categories");
        },
        onError: (error: any) => {
          message.error(error?.message || "Failed to update category");
        },
      }
    );
  };

  const category = result;
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
            onClick={() => router.push("/resources/categories")}
          >
            Back
          </Button>
          <Title level={4} style={{ margin: 0 }}>
            Edit Category: {category?.name || id}
          </Title>
        </Space>

        <Form
          form={form}
          layout="vertical"
          initialValues={{
            name: category?.name || "",
            description: category?.description || "",
            thumbnail: category?.thumbnail || "",
          }}
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
                loading={updateMutation.isPending}
              >
                Save Changes
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