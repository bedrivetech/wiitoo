"use client";

import { useOne, useUpdate, useList } from "@refinedev/core";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Space,
  Typography,
  Spin,
  Switch,
  message,
  Divider,
  Tag,
} from "antd";
import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";

const { Title } = Typography;

export default function CategoriesEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [form] = Form.useForm();

  const { query, result: category } = useOne({
    resource: "categories",
    id,
  });

  const { data: categoriesData } = useList({
    resource: "categories",
    pagination: { currentPage: 1, pageSize: 200 },
  });

  const { mutate: update, mutation: updateMutation } = useUpdate();

  const handleFinish = (values: any) => {
    const payload = { ...values };
    // If parent_category_id is undefined/null, set to empty
    if (payload.parent_category_id === undefined || payload.parent_category_id === null) {
      delete payload.parent_category_id;
    }
    update(
      {
        resource: "categories",
        id,
        values: payload,
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

  const c = category as any;
  const isLoading = query.isLoading;
  const allCats = (categoriesData?.data || []) as any[];
  const parentOptions = allCats
    ?.filter((cat: any) => cat.id !== id)
    ?.map((cat: any) => ({
      label: cat.name,
      value: cat.id,
    })) || [];
  parentOptions.unshift({ label: "(No parent)", value: undefined });

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
            Edit Category: {c?.name || id}
          </Title>
          <Tag>{c?.id?.substring(0, 8)}</Tag>
        </Space>

        <Form
          form={form}
          layout="vertical"
          initialValues={{
            name: c?.name || "",
            description: c?.description || "",
            sort_order: c?.sort_order ?? 0,
            active: c?.active ?? true,
            parent_category_id: c?.parent_category_id || undefined,
            thumbnail: c?.thumbnail || "",
          }}
          onFinish={handleFinish}
          style={{ maxWidth: 500 }}
        >
          <Divider orientation="left">Details</Divider>

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

          <Divider orientation="left">Organization</Divider>

          <Form.Item label="Sort Order" name="sort_order">
            <InputNumber
              min={0}
              max={99999}
              style={{ width: "100%" }}
              placeholder="Display order (lower = first)"
            />
          </Form.Item>

          <Form.Item label="Parent Category" name="parent_category_id">
            <Select
              allowClear
              placeholder="Select parent category"
              options={parentOptions}
            />
          </Form.Item>

          <Form.Item label="Active" name="active" valuePropName="checked">
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