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

export default function TemplatesEdit() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [form] = Form.useForm();

  const { query, result } = useOne({
    resource: "templates",
    id,
  });

  const { mutate: update, mutation: updateMutation } = useUpdate();

  const handleFinish = (values: any) => {
    update(
      {
        resource: "templates",
        id,
        values,
      },
      {
        onSuccess: () => {
          message.success("Template updated successfully");
          router.push("/resources/templates");
        },
        onError: (error: any) => {
          message.error(error?.message || "Failed to update template");
        },
      }
    );
  };

  const template = result;
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
            onClick={() => router.push("/resources/templates")}
          >
            Back
          </Button>
          <Title level={4} style={{ margin: 0 }}>
            Edit Template: {template?.name || id}
          </Title>
        </Space>

        <Form
          form={form}
          layout="vertical"
          initialValues={{
            name: template?.name || "",
            type: template?.type || "email",
            subject: template?.subject || "",
            body: template?.body || "",
          }}
          onFinish={handleFinish}
          style={{ maxWidth: 600 }}
        >
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: "Please enter a template name" }]}
          >
            <Input placeholder="Template name" />
          </Form.Item>

          <Form.Item
            label="Type"
            name="type"
            rules={[{ required: true, message: "Please select a type" }]}
          >
            <Select
              options={[
                { label: "Email", value: "email" },
                { label: "Push Notification", value: "push" },
                { label: "SMS", value: "sms" },
                { label: "In-App", value: "in_app" },
              ]}
            />
          </Form.Item>

          <Form.Item
            label="Subject"
            name="subject"
            rules={[{ required: true, message: "Please enter a subject" }]}
          >
            <Input placeholder="Template subject" />
          </Form.Item>

          <Form.Item
            label="Body"
            name="body"
            rules={[{ required: true, message: "Please enter the body content" }]}
          >
            <Input.TextArea rows={6} placeholder="Template body content" />
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
              <Button onClick={() => router.push("/resources/templates")}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Space>
    </Card>
  );
}