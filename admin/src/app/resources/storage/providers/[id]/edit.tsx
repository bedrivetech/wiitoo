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
import { ArrowLeftOutlined, SaveOutlined, HddOutlined } from "@ant-design/icons";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";

const { Title } = Typography;

const providerTypes = [
  { label: "Wasabi", value: "wasabi" },
  { label: "Backblaze B2", value: "backblaze" },
  { label: "IDrive e2", value: "idrive" },
  { label: "Cloudflare R2", value: "r2" },
  { label: "Generic S3", value: "s3" },
];

export default function EditProviderPage() {
  const params = useParams();
  const { list } = useNavigation();
  const id = params.id as string;
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [providerType, setProviderType] = useState<string>("wasabi");

  const { query, result } = useOne({
    resource: "storage/providers",
    id,
  });

  const provider = result;

  useEffect(() => {
    if (provider) {
      form.setFieldsValue({
        name: provider.name,
        providerType: provider.providerType,
        defaultRegion: provider.defaultRegion,
        endpoint: provider.endpoint || "",
        priority: provider.priority,
        weight: provider.weight,
        isActive: provider.isActive,
      });
      setProviderType(provider.providerType);
    }
  }, [provider, form]);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    const token = localStorage.getItem("access_token");
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    const body: Record<string, any> = {};
    if (values.name !== provider?.name) body.name = values.name;
    if (values.providerType !== provider?.providerType) body.providerType = values.providerType;
    if (values.defaultRegion !== provider?.defaultRegion) body.defaultRegion = values.defaultRegion;
    if (values.endpoint !== (provider?.endpoint || "")) body.endpoint = values.endpoint;
    if (values.priority !== provider?.priority) body.priority = values.priority;
    if (values.weight !== provider?.weight) body.weight = values.weight;
    if (values.accessKey) body.accessKey = values.accessKey;
    if (values.secretKey) body.secretKey = values.secretKey;

    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/storage/providers/${id}`, {
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
        list("storage/providers");
      } else {
        message.error(json.error?.message || "Failed to update provider");
      }
    } catch (err: any) {
      message.error(err.message || "Failed to update provider");
    } finally {
      setLoading(false);
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
              <Button icon={<ArrowLeftOutlined />} onClick={() => list("storage/providers")} />
              <Title level={4} style={{ margin: 0 }}>
                <HddOutlined /> Edit Provider: {provider.name}
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
            <Input placeholder="Wasabi Production" />
          </Form.Item>

          <Form.Item label="Provider Type" name="providerType">
            <Select
              options={providerTypes}
              onChange={(val) => setProviderType(val)}
            />
          </Form.Item>

          <Title level={5}>Credentials</Title>
          <Form.Item label="Access Key" name="accessKey">
            <Input.Password placeholder="Leave blank to keep current" />
          </Form.Item>
          <Form.Item label="Secret Key" name="secretKey">
            <Input.Password placeholder="Leave blank to keep current" />
          </Form.Item>

          <Title level={5}>Connection</Title>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Default Region" name="defaultRegion">
                <Input placeholder="us-east-1" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Endpoint" name="endpoint">
                <Input placeholder="https://s3.wasabisys.com" />
              </Form.Item>
            </Col>
          </Row>

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
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
              Save Changes
            </Button>
          </Form.Item>
        </Form>
      </Space>
    </Card>
  );
}