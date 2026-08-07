"use client";

import { useState, useEffect } from "react";
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
import { ArrowLeftOutlined, SaveOutlined, FolderOutlined } from "@ant-design/icons";

const { Title } = Typography;

export default function CreateBucketPage() {
  const { list } = useNavigation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    fetch(`${API_BASE}/api/v1/admin/storage/providers`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-User-Role": "admin",
      },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setProviders(json.data || []);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    const token = localStorage.getItem("access_token");
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    const body = {
      providerId: values.providerId,
      name: values.name,
      displayName: values.displayName,
      region: values.region || "us-east-1",
      usage: values.usage || "general",
      maxSizeGB: values.maxSizeGB || 0,
      isActive: true,
    };

    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/storage/buckets`, {
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
        message.success("Bucket created successfully");
        list("storage/buckets");
      } else {
        message.error(json.error?.message || "Failed to create bucket");
      }
    } catch (err: any) {
      message.error(err.message || "Failed to create bucket");
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
              <Button icon={<ArrowLeftOutlined />} onClick={() => list("storage/buckets")} />
              <Title level={4} style={{ margin: 0 }}>
                <FolderOutlined /> Add Storage Bucket
              </Title>
            </Space>
          </Col>
        </Row>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ region: "us-east-1", usage: "general" }}
          style={{ maxWidth: 600 }}
        >
          <Form.Item
            label="Provider"
            name="providerId"
            rules={[{ required: true, message: "Provider is required" }]}
          >
            <Select
              placeholder="Select provider"
              options={providers.map((p: any) => ({
                label: `${p.name} (${p.providerType})`,
                value: p.id,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="S3 Bucket Name"
            name="name"
            rules={[{ required: true, message: "Bucket name is required" }]}
          >
            <Input placeholder="my-video-bucket" />
          </Form.Item>

          <Form.Item
            label="Display Name"
            name="displayName"
            rules={[{ required: true, message: "Display name is required" }]}
          >
            <Input placeholder="Video Bucket" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Region" name="region">
                <Input placeholder="us-east-1" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Usage Type" name="usage">
                <Select
                  options={[
                    { label: "Video", value: "video" },
                    { label: "Thumbnail", value: "thumbnail" },
                    { label: "Backup", value: "backup" },
                    { label: "General", value: "general" },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Max Size (GB, 0 = unlimited)" name="maxSizeGB">
            <Input type="number" placeholder="0" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
              Create Bucket
            </Button>
          </Form.Item>
        </Form>
      </Space>
    </Card>
  );
}