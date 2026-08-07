"use client";

import { useState } from "react";
import { useNavigation } from "@refinedev/core";
import {
  Card,
  Typography,
  Form,
  Input,
  Select,
  Button,
  Space,
  message,
  Row,
  Col,
} from "antd";
import { ArrowLeftOutlined, SendOutlined, MailOutlined } from "@ant-design/icons";

const { Title } = Typography;
const { TextArea } = Input;

const providerTypes = [
  { label: "Brevo (Sendinblue)", value: "brevo" },
  { label: "SendPulse", value: "sendpulse" },
  { label: "SMTP", value: "smtp" },
  { label: "Console (Dev)", value: "console" },
];

export default function CreateProviderPage() {
  const { list } = useNavigation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [providerType, setProviderType] = useState<string>("brevo");

  const handleSubmit = async (values: any) => {
    setLoading(true);
    const token = localStorage.getItem("access_token");
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    const config: Record<string, string> = {};
    if (values.api_key) config.api_key = values.api_key;
    if (values.client_id) config.client_id = values.client_id;
    if (values.secret) config.secret = values.secret;
    if (values.host) config.host = values.host;
    if (values.port) config.port = values.port;
    if (values.username) config.username = values.username;
    if (values.password) config.password = values.password;
    if (values.use_tls) config.use_tls = "true";

    const body = {
      name: values.name,
      providerType: values.providerType,
      config,
      priority: values.priority || 0,
      weight: values.weight || 1,
      fromName: values.fromName,
      fromEmail: values.fromEmail,
    };

    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/email/providers`, {
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
        message.success("Provider created successfully");
        list("email/providers");
      } else {
        message.error(json.error?.message || "Failed to create provider");
      }
    } catch (err: any) {
      message.error(err.message || "Failed to create provider");
    } finally {
      setLoading(false);
    }
  };

  const renderProviderConfig = () => {
    switch (providerType) {
      case "brevo":
        return (
          <>
            <Form.Item
              label="API Key"
              name="api_key"
              rules={[{ required: true, message: "API key is required" }]}
            >
              <Input.Password placeholder="xkeysib-..." />
            </Form.Item>
          </>
        );
      case "sendpulse":
        return (
          <>
            <Form.Item
              label="Client ID"
              name="client_id"
              rules={[{ required: true, message: "Client ID is required" }]}
            >
              <Input placeholder="SendPulse client ID" />
            </Form.Item>
            <Form.Item
              label="Client Secret"
              name="secret"
              rules={[{ required: true, message: "Client secret is required" }]}
            >
              <Input.Password placeholder="SendPulse client secret" />
            </Form.Item>
          </>
        );
      case "smtp":
        return (
          <>
            <Form.Item
              label="SMTP Host"
              name="host"
              rules={[{ required: true, message: "Host is required" }]}
            >
              <Input placeholder="smtp.example.com" />
            </Form.Item>
            <Form.Item
              label="Port"
              name="port"
              rules={[{ required: true, message: "Port is required" }]}
            >
              <Input placeholder="587" />
            </Form.Item>
            <Form.Item label="Username" name="username">
              <Input placeholder="SMTP username" />
            </Form.Item>
            <Form.Item label="Password" name="password">
              <Input.Password placeholder="SMTP password" />
            </Form.Item>
          </>
        );
      case "console":
        return (
          <div style={{ color: "#666", fontStyle: "italic" }}>
            Console provider logs emails to stdout — no configuration needed.
          </div>
        );
      default:
        return null;
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
                onClick={() => list("email/providers")}
              />
              <Title level={4} style={{ margin: 0 }}>
                <MailOutlined /> Add Email Provider
              </Title>
            </Space>
          </Col>
        </Row>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ providerType: "brevo", priority: 0, weight: 1 }}
          style={{ maxWidth: 600 }}
        >
          <Form.Item
            label="Provider Name"
            name="name"
            rules={[{ required: true, message: "Name is required" }]}
          >
            <Input placeholder="Brevo Production" />
          </Form.Item>

          <Form.Item
            label="Provider Type"
            name="providerType"
            rules={[{ required: true }]}
          >
            <Select
              options={providerTypes}
              onChange={(val) => setProviderType(val)}
            />
          </Form.Item>

          <Title level={5}>Provider Configuration</Title>
          {renderProviderConfig()}

          <Title level={5}>Sender Details</Title>
          <Form.Item
            label="From Name"
            name="fromName"
            rules={[{ required: true, message: "From name is required" }]}
          >
            <Input placeholder="Wiitoo" />
          </Form.Item>
          <Form.Item
            label="From Email"
            name="fromEmail"
            rules={[
              { required: true, message: "From email is required" },
              { type: "email", message: "Invalid email" },
            ]}
          >
            <Input placeholder="noreply@fusionplatform.com" />
          </Form.Item>

          <Title level={5}>Routing</Title>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Priority" name="priority">
                <Input type="number" placeholder="0 (highest)" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Weight" name="weight">
                <Input type="number" placeholder="1" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SendOutlined />}
              loading={loading}
            >
              Create Provider
            </Button>
          </Form.Item>
        </Form>
      </Space>
    </Card>
  );
}