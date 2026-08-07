"use client";

import { useNavigation } from "@refinedev/core";
import {
  Card,
  Typography,
  Form,
  Input,
  Button,
  Space,
  message,
  Row,
  Col,
  Alert,
} from "antd";
import { ArrowLeftOutlined, SaveOutlined, FileTextOutlined } from "@ant-design/icons";
import { useState } from "react";

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function CreateTemplatePage() {
  const { list } = useNavigation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [extractedVars, setExtractedVars] = useState<string[]>([]);

  const extractVariables = (text: string): string[] => {
    const regex = /\{\{(\w+)\}\}/g;
    const matches = new Set<string>();
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.add(match[1]);
    }
    return Array.from(matches);
  };

  const handleContentChange = () => {
    const subject = form.getFieldValue("subject") || "";
    const textBody = form.getFieldValue("textBody") || "";
    const htmlBody = form.getFieldValue("htmlBody") || "";
    const vars = extractVariables(subject + textBody + htmlBody);
    setExtractedVars(vars);
    form.setFieldsValue({ variables: vars });
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    const token = localStorage.getItem("access_token");
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    const body = {
      name: values.name,
      description: values.description || "",
      subject: values.subject,
      textBody: values.textBody,
      htmlBody: values.htmlBody,
      variables: values.variables || [],
    };

    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/email/templates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-User-Role": "admin",
        },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        message.success("Template created successfully");
        list("email/templates");
      } else {
        message.error(json.error?.message || "Failed to create template");
      }
    } catch (err: any) {
      message.error(err.message || "Failed to create template");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Row align="middle">
          <Col>
            <Space>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => list("email/templates")}
              />
              <Title level={4} style={{ margin: 0 }}>
                <FileTextOutlined /> Create Email Template
              </Title>
            </Space>
          </Col>
        </Row>

        <Alert
          message="Variable syntax"
          description='Use {{variable_name}} in subject and body text for dynamic content. Variables are auto-detected from your content.'
          type="info"
          showIcon
        />

        {extractedVars.length > 0 && (
          <Alert
            message={`Detected variables: ${extractedVars.join(", ")}`}
            type="success"
            showIcon
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ maxWidth: 800 }}
        >
          <Form.Item
            label="Template Name"
            name="name"
            rules={[{ required: true, message: "Name is required" }]}
          >
            <Input placeholder="welcome_email" />
          </Form.Item>

          <Form.Item label="Description" name="description">
            <Input placeholder="Sent when a new user registers" />
          </Form.Item>

          <Form.Item
            label="Subject"
            name="subject"
            rules={[{ required: true, message: "Subject is required" }]}
          >
            <Input
              placeholder="Welcome to {{app_name}}!"
              onChange={handleContentChange}
            />
          </Form.Item>

          <Form.Item
            label="Text Body"
            name="textBody"
            rules={[{ required: true, message: "Text body is required" }]}
          >
            <TextArea
              rows={6}
              placeholder="Hello {{username}}, welcome to {{app_name}}!"
              onChange={handleContentChange}
            />
          </Form.Item>

          <Form.Item
            label="HTML Body"
            name="htmlBody"
            rules={[{ required: true, message: "HTML body is required" }]}
          >
            <TextArea
              rows={8}
              placeholder="<h2>Hello {{username}}!</h2><p>Welcome to {{app_name}}.</p>"
              onChange={handleContentChange}
            />
          </Form.Item>

          <Form.Item label="Variables (auto-detected)" name="variables">
            <Input disabled placeholder="Variables are auto-detected" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={loading}
            >
              Create Template
            </Button>
          </Form.Item>
        </Form>
      </Space>
    </Card>
  );
}