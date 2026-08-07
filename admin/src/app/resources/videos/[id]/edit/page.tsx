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
  Switch,
  message,
} from "antd";
import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";

const { Title } = Typography;

export default function VideosEdit() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [form] = Form.useForm();

  const { query, result } = useOne({
    resource: "videos",
    id,
  });

  const { mutate: update, mutation: updateMutation } = useUpdate();

  const handleFinish = (values: any) => {
    update(
      {
        resource: "videos",
        id,
        values,
      },
      {
        onSuccess: () => {
          message.success("Video updated successfully");
          router.push("/resources/videos");
        },
        onError: (error: any) => {
          message.error(error?.message || "Failed to update video");
        },
      }
    );
  };

  const video = result;
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
            onClick={() => router.push("/resources/videos")}
          >
            Back
          </Button>
          <Title level={4} style={{ margin: 0 }}>
            Edit Video: {video?.title || id}
          </Title>
        </Space>

        <Form
          form={form}
          layout="vertical"
          initialValues={{
            title: video?.title || "",
            description: video?.description || "",
            visibility: video?.visibility || "public",
            featured: video?.featured || false,
          }}
          onFinish={handleFinish}
          style={{ maxWidth: 600 }}
        >
          <Form.Item label="Title" name="title">
            <Input placeholder="Video title" />
          </Form.Item>

          <Form.Item label="Description" name="description">
            <Input.TextArea rows={4} placeholder="Video description" />
          </Form.Item>

          <Form.Item label="Visibility" name="visibility">
            <Select
              options={[
                { label: "Public", value: "public" },
                { label: "Private", value: "private" },
                { label: "Unlisted", value: "unlisted" },
              ]}
            />
          </Form.Item>

          <Form.Item label="Featured" name="featured" valuePropName="checked">
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
              <Button onClick={() => router.push("/resources/videos")}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Space>
    </Card>
  );
}