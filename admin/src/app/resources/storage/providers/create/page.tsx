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
import { ArrowLeftOutlined, SaveOutlined, HddOutlined } from "@ant-design/icons";

const { Title } = Typography;

const providerTypes = [
  { label: "Wasabi", value: "wasabi" },
  { label: "Backblaze B2", value: "backblaze" },
  { label: "IDrive e2", value: "idrive" },
  { label: "Cloudflare R2", value: "r2" },
  { label: "Generic S3", value: "s3" },
];

export default function CreateProviderPage() {
  const { list } = useNavigation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [providerType, setProviderType] = useState<string>("wasabi");

  const handleSubmit = async (values: any) => {
    setLoading(true);
    const token = localStorage.getItem("access_token");
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    const body = {
      name: values.name,
      providerType: values.providerType,
      accessKey: values.accessKey,
      secretKey: values.secretKey,
      defaultRegion: values.defaultRegion || "us-east-1",
      endpoint: values.endpoint || "",
      priority: values.priority || 0,
      weight: values.weight || 1,
    };

    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/storage/providers`, {
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
        list("storage/providers");
      } else {
        message.error(json.error?.message || "Failed to create provider");
      }
    } catch (err: any) {
      message.error(err.message || "Failed to create provider");
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
                onClick={() => list("storage/providers")}
              />
              <Title level={4} style={{ margin: 0 }}>
                <HddOutlined /> Add Storage Provider
              </Title>
            </Space>
          </Col>
        </Row>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ providerType: "wasabi", defaultRegion: "us-east-1", priority: 0, weight: 1 }}
          style={{ maxWidth: 600 }}
        >
          <Form.Item
            label="Provider Name"
            name="name"
            rules={[{ required: true, message: "Name is required" }]}
          >
            <Input placeholder="Wasabi Production" />
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

          {providerType === "r2" && (
            <div style={{ color: "#666", fontStyle: "italic", marginBottom: 16 }}>
              R2 region is set to "auto" automatically. Endpoint format: {'https://{account_id}.r2.cloudflarestorage.com'}
            </div>
          )}

          <Title level={5}>Credentials</Title>
          <Form.Item
            label="Access Key"
            name="accessKey"
            rules={[{ required: true, message: "Access key is required" }]}
          >
            <Input.Password placeholder="S3 access key" />
          </Form.Item>
          <Form.Item
            label="Secret Key"
            name="secretKey"
            rules={[{ required: true, message: "Secret key is required" }]}
          >
            <Input.Password placeholder="S3 secret key" />
          </Form.Item>

          <Title level={5}>Connection</Title>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Default Region"
                name="defaultRegion"
                rules={[{ required: true, message: "Region is required" }]}
              >
                <Input placeholder="us-east-1" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Custom Endpoint" name="endpoint">
                <Input placeholder="https://s3.wasabisys.com" />
              </Form.Item>
            </Col>
          </Row>

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
              icon={<SaveOutlined />}
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