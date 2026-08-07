"use client";

import { useNavigation, useOne } from "@refinedev/core";
import {
  Card,
  Typography,
  Descriptions,
  Tag,
  Space,
  Button,
  Row,
  Col,
  Spin,
  Divider,
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  MailOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { useParams } from "next/navigation";

const { Title, Text } = Typography;

const typeColors: Record<string, string> = {
  brevo: "blue",
  sendpulse: "purple",
  smtp: "orange",
  console: "default",
};

export default function ProviderDetailPage() {
  const params = useParams();
  const { edit, list } = useNavigation();
  const id = params.id as string;

  const { query, result } = useOne({
    resource: "email/providers",
    id,
  });

  const provider = result;

  if (query.isLoading) {
    return <Spin size="large" style={{ display: "block", margin: "100px auto" }} />;
  }

  if (!provider) {
    return (
      <Card>
        <Text type="danger">Provider not found</Text>
      </Card>
    );
  }

  return (
    <Card>
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => list("email/providers")}
              />
              <Title level={4} style={{ margin: 0 }}>
                <MailOutlined /> {provider.name}
              </Title>
            </Space>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => edit("email/providers", id)}
            >
              Edit
            </Button>
          </Col>
        </Row>

        <Descriptions bordered column={2}>
          <Descriptions.Item label="Type">
            <Tag color={typeColors[provider.providerType] || "default"}>
              {provider.providerType}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Space>
              <Tag color={provider.isActive ? "green" : "red"}>
                {provider.isActive ? "Active" : "Inactive"}
              </Tag>
              {provider.isHealthy ? (
                <Tag icon={<CheckCircleOutlined />} color="success">
                  Healthy
                </Tag>
              ) : (
                <Tag icon={<CloseCircleOutlined />} color="error">
                  Unhealthy
                </Tag>
              )}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Priority">{provider.priority}</Descriptions.Item>
          <Descriptions.Item label="Weight">{provider.weight}</Descriptions.Item>
          <Descriptions.Item label="From Name">{provider.fromName}</Descriptions.Item>
          <Descriptions.Item label="From Email">{provider.fromEmail}</Descriptions.Item>
          <Descriptions.Item label="Created At" span={2}>
            {new Date(provider.createdAt).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="Last Health Check" span={2}>
            {provider.lastHealthCheck
              ? new Date(provider.lastHealthCheck).toLocaleString()
              : "Never"}
          </Descriptions.Item>
        </Descriptions>

        {provider.config && Object.keys(provider.config).length > 0 && (
          <>
            <Divider />
            <Title level={5}>Configuration</Title>
            <Descriptions bordered column={1}>
              {Object.entries(provider.config)
                .filter(([key]) => !["password", "api_key", "secret"].includes(key) || false)
                .map(([key, value]) => (
                  <Descriptions.Item key={key} label={key}>
                    {typeof value === "string" ? value : JSON.stringify(value)}
                  </Descriptions.Item>
                ))}
            </Descriptions>
          </>
        )}
      </Space>
    </Card>
  );
}