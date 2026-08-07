"use client";

import { useNavigation, useOne } from "@refinedev/core";
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
  Spin,
} from "antd";
import { ArrowLeftOutlined, SaveOutlined, MailOutlined } from "@ant-design/icons";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";

const { Title } = Typography;

const providerTypes = [
  { label: "Brevo (Sendinblue)", value: "brevo" },
  { label: "SendPulse", value: "sendpulse" },
  { label: "SMTP", value: "smtp" },
  { label: "Console (Dev)", value: "console" },
];

export default function EditProviderPage() {
  const params = useParams();
  const { list } = useNavigation();
  const id = params.id as string;
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [providerType, setProviderType] = useState<string>("brevo");

  const { query, result } = useOne({
    resource: "email/providers",
    id,
  });

  const provider = result;

  useEffect(() => {
    if (provider) {
      form.setFieldsValue({
        name: provider.name,
        providerType: provider.providerType,
        priority: provider.priority,
        weight: provider.weight,
        fromName: provider.fromName,
        fromEmail: provider.fromEmail,
        ...(provider.config || {}),
      });
      setProviderType(provider.providerType);
    }
  }, [provider, form]);

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
    if (values.use_tls) config.use_tls = values.use_tls;

    const body: Record<string, any> = {};
    if (values.name !== provider?.name) body.name = values.name;
    if (values.providerType !== provider?.providerType) body.providerType = values.providerType;
    if (values.priority !== provider?.priority) body.priority = values.priority;
    if (values.weight !== provider?.weight) body.weight = values.weight;
    if (values.fromName !== provider?.fromName) body.fromName = values.fromName;
    if (values.fromEmail !== provider?.fromEmail) body.fromEmail = values.fromEmail;
    if (Object.keys(config).length > 0) body.config = config;

    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/email/providers/${id}`, {
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
        message.success("Provider updated successfully");
        list("email/providers");
      } else {
        message.error(json.error?.message || "Failed to update provider");
      }
    } catch (err: any) {
      message.error(err.message || "Failed to update provider");
    } finally {
      setLoading(false);
    }
  };

  const renderProviderConfig = () => {
    switch (providerType) {
      case "brevo":
        return (
          <Form.Item label="API Key" name="api_key">
            <Input.Password placeholder="xkeysib-..." />
          </Form.Item>
        );
      case "sendpulse":
        return (
          <>
            <Form.Item label="Client ID" name="client_id">
              <Input placeholder="SendPulse client ID" />
            </Form.Item>
            <Form.Item label="Client Secret" name="secret">
              <Input.Password placeholder="SendPulse client secret" />
            </Form.Item>
          </>
        );
      case "smtp":
        return (
          <>
            <Form.Item label="SMTP Host" name="host">
              <Input placeholder="smtp.example.com" />
            </Form.Item>
            <Form.Item label="Port" name="port">
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

  if (query.isLoading) {
    return <Spin size="large" style={{ display: "block", margin: "100px auto" }} />;
  }

  if (!provider) {
    return (
      <Card>
        <p>Provider not found</p>
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
                onClick={() => list("email/providers")}
              />
              <Title level={4} style={{ margin: 0 }}>
                <MailOutlined /> Edit Provider: {provider.name}
              </Title>
            </Space>
          </Col>
        </Row>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ maxWidth: 600 }}
        >
          <Form.Item label="Provider Name" name="name">
            <Input />
          </Form.Item>

          <Form.Item label="Provider Type" name="providerType">
            <Select
              options={providerTypes}
              onChange={(val) => setProviderType(val)}
            />
          </Form.Item>

          <Title level={5}>Provider Configuration</Title>
          {renderProviderConfig()}

          <Title level={5}>Sender Details</Title>
          <Form.Item label="From Name" name="fromName">
            <Input placeholder="Wiitoo" />
          </Form.Item>
          <Form.Item label="From Email" name="fromEmail">
            <Input placeholder="noreply@fusionplatform.com" />
          </Form.Item>

          <Title level={5}>Routing</Title>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Priority" name="priority">
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Weight" name="weight">
                <Input type="number" />
              </Form.Item>
            </Col>
          </Row>

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
      </Space>
    </Card>
  );
}