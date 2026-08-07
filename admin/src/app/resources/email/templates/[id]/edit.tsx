"use client";

import { useNavigation, useOne } from "@refinedev/core";
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
  Spin,
  Alert,
  Divider,
} from "antd";
import { ArrowLeftOutlined, SaveOutlined, FileTextOutlined } from "@ant-design/icons";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";

const { Title } = Typography;
const { TextArea } = Input;

export default function EditTemplatePage() {
  const params = useParams();
  const { list } = useNavigation();
  const id = params.id as string;
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [previewHTML, setPreviewHTML] = useState("");

  const { query, result } = useOne({
    resource: "email/templates",
    id,
  });

  const tmpl = result;

  useEffect(() => {
    if (tmpl) {
      form.setFieldsValue({
        name: tmpl.name,
        description: tmpl.description,
        subject: tmpl.subject,
        textBody: tmpl.textBody,
        htmlBody: tmpl.htmlBody,
        variables: tmpl.variables?.join(", ") || "",
      });
      updatePreview();
    }
  }, [tmpl, form]);

  const extractVariables = (text: string): string[] => {
    const regex = /\{\{(\w+)\}\}/g;
    const matches = new Set<string>();
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.add(match[1]);
    }
    return Array.from(matches);
  };

  const updatePreview = () => {
    const htmlBody = form.getFieldValue("htmlBody") || "";
    const vars = extractVariables(htmlBody);
    let preview = htmlBody;
    vars.forEach((v) => {
      preview = preview.replaceAll(`{{${v}}}`, `[${v}]`);
    });
    setPreviewHTML(preview);
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    const token = localStorage.getItem("access_token");
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    const vars = extractVariables(
      (values.subject || "") + (values.textBody || "") + (values.htmlBody || "")
    );

    const body: Record<string, any> = {
      subject: values.subject,
      textBody: values.textBody,
      htmlBody: values.htmlBody,
    };
    if (values.name !== tmpl?.name) body.name = values.name;
    if (values.description !== tmpl?.description) body.description = values.description;
    if (vars.length > 0) body.variables = vars;

    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/email/templates/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-User-Role": "admin",
        },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        message.success("Template updated successfully");
        list("email/templates");
      } else {
        message.error(json.error?.message || "Failed to update template");
      }
    } catch (err: any) {
      message.error(err.message || "Failed to update template");
    } finally {
      setLoading(false);
    }
  };

  if (query.isLoading) {
    return <Spin size="large" style={{ display: "block", margin: "100px auto" }} />;
  }

  if (!tmpl) {
    return (
      <Card>
        <p>Template not found</p>
      </Card>
    );
  }

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
                <FileTextOutlined /> Edit Template: {tmpl.name}
              </Title>
            </Space>
          </Col>
        </Row>

        <Alert
          message="Use {{variable_name}} syntax in subject and body text."
          type="info"
          showIcon
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          onValuesChange={updatePreview}
          style={{ maxWidth: 800 }}
        >
          <Form.Item label="Template Name" name="name">
            <Input disabled={tmpl.isSystem} />
          </Form.Item>

          <Form.Item label="Description" name="description">
            <Input />
          </Form.Item>

          <Form.Item
            label="Subject"
            name="subject"
            rules={[{ required: true, message: "Subject is required" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Text Body"
            name="textBody"
            rules={[{ required: true, message: "Text body is required" }]}
          >
            <TextArea rows={6} style={{ fontFamily: "monospace" }} />
          </Form.Item>

          <Form.Item
            label="HTML Body"
            name="htmlBody"
            rules={[{ required: true, message: "HTML body is required" }]}
          >
            <TextArea rows={8} style={{ fontFamily: "monospace" }} />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={loading}
            >
              Save Changes
            </Button>
          </Form.Item>
        </Form>

        <Divider />
        <Title level={5}>Live Preview</Title>
        <div
          style={{
            border: "1px solid #d9d9d9",
            borderRadius: 8,
            padding: 24,
            background: "#fff",
            minHeight: 100,
          }}
          dangerouslySetInnerHTML={{ __html: previewHTML }}
        />
      </Space>
    </Card>
  );
}