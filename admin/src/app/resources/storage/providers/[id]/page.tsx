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
  HddOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { useParams } from "next/navigation";

const { Title, Text } = Typography;

const typeColors: Record<string, string> = {
  wasabi: "blue",
  backblaze: "orange",
  idrive: "green",
  r2: "purple",
  s3: "default",
};

export default function ProviderDetailPage() {
  const params = useParams();
  const { edit, list } = useNavigation();
  const id = params.id as string;

  const { query, result } = useOne({
    resource: "storage/providers",
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
                onClick={() => list("storage/providers")}
              />
              <Title level={4} style={{ margin: 0 }}>
                <HddOutlined /> {provider.name}
              </Title>
            </Space>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => edit("storage/providers", id)}
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
                <Tag icon={<CheckCircleOutlined />} color="success">Healthy</Tag>
              ) : (
                <Tag icon={<CloseCircleOutlined />} color="error">Unhealthy</Tag>
              )}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Region">{provider.defaultRegion}</Descriptions.Item>
          <Descriptions.Item label="Endpoint">{provider.endpoint || "(default)"}</Descriptions.Item>
          <Descriptions.Item label="Priority">{provider.priority}</Descriptions.Item>
          <Descriptions.Item label="Weight">{provider.weight}</Descriptions.Item>
          <Descriptions.Item label="Total Size">{provider.totalSizeGB} GB</Descriptions.Item>
          <Descriptions.Item label="Last Health Check">
            {provider.lastHealthCheck
              ? new Date(provider.lastHealthCheck).toLocaleString()
              : "Never"}
          </Descriptions.Item>
          <Descriptions.Item label="Created At" span={2}>
            {new Date(provider.createdAt).toLocaleString()}
          </Descriptions.Item>
        </Descriptions>
      </Space>
    </Card>
  );
}