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

export default function TemplatesCreate() {
  const router = useRouter();
  const [form] = Form.useForm();
  const { mutate: createTemplate, mutation: createMutation } = useCreate();

  const handleFinish = (values: any) => {
    createTemplate(
      {
        resource: "templates",
        values,
      },
      {
        onSuccess: () => {
          message.success("Template created successfully");
          router.push("/resources/templates");
        },
        onError: (error: any) => {
          message.error(error?.message || "Failed to create template");
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
            onClick={() => router.push("/resources/templates")}
          >
            Back
          </Button>
          <Title level={4} style={{ margin: 0 }}>
            Create Template
          </Title>
        </Space>

        <Form
          form={form}
          layout="vertical"
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
                loading={createMutation.isPending}
              >
                Create
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