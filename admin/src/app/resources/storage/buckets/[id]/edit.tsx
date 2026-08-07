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
import { ArrowLeftOutlined, SaveOutlined, FolderOutlined } from "@ant-design/icons";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";

const { Title } = Typography;

export default function EditBucketPage() {
  const params = useParams();
  const { list } = useNavigation();
  const id = params.id as string;
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const { query, result } = useOne({
    resource: "storage/buckets",
    id,
  });

  const bucket = result;

  useEffect(() => {
    if (bucket) {
      form.setFieldsValue({
        name: bucket.name,
        displayName: bucket.displayName,
        region: bucket.region,
        usage: bucket.usage,
        maxSizeGB: bucket.maxSizeGB,
      });
    }
  }, [bucket, form]);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    const token = localStorage.getItem("access_token");
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    const body: Record<string, any> = {};
    if (values.name !== bucket?.name) body.name = values.name;
    if (values.displayName !== bucket?.displayName) body.displayName = values.displayName;
    if (values.region !== bucket?.region) body.region = values.region;
    if (values.usage !== bucket?.usage) body.usage = values.usage;
    if (values.maxSizeGB !== bucket?.maxSizeGB) body.maxSizeGB = values.maxSizeGB;

    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/storage/buckets/${id}`, {
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
        message.success("Bucket updated successfully");
        list("storage/buckets");
      } else {
        message.error(json.error?.message || "Failed to update bucket");
      }
    } catch (err: any) {
      message.error(err.message || "Failed to update bucket");
    } finally {
      setLoading(false);
    }
  };

  if (query.isLoading) {
    return <Spin size="large" style={{ display: "block", margin: "100px auto" }} />;
  }

  if (!bucket) {
    return (
      <Card>
        <p>Bucket not found</p>
      </Card>
    );
  }

  return (
    <Card>
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Row align="middle">
          <Col>
            <Space>
              <Button icon={<ArrowLeftOutlined />} onClick={() => list("storage/buckets")} />
              <Title level={4} style={{ margin: 0 }}>
                <FolderOutlined /> Edit Bucket: {bucket.displayName}
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
          <Form.Item label="S3 Bucket Name" name="name">
            <Input placeholder="my-bucket-name" />
          </Form.Item>
          <Form.Item label="Display Name" name="displayName">
            <Input placeholder="My Bucket" />
          </Form.Item>
          <Form.Item label="Region" name="region">
            <Input placeholder="us-east-1" />
          </Form.Item>
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
          <Form.Item label="Max Size (GB, 0 = unlimited)" name="maxSizeGB">
            <Input type="number" placeholder="0" />
          </Form.Item>

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