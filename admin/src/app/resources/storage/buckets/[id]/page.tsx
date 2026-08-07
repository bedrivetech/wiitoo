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
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  FolderOutlined,
} from "@ant-design/icons";
import { useParams } from "next/navigation";

const { Title, Text } = Typography;

const usageColors: Record<string, string> = {
  video: "blue",
  thumbnail: "green",
  backup: "orange",
  general: "default",
};

export default function BucketDetailPage() {
  const params = useParams();
  const { edit, list } = useNavigation();
  const id = params.id as string;

  const { query, result } = useOne({
    resource: "storage/buckets",
    id,
  });

  const bucket = result;

  if (query.isLoading) {
    return <Spin size="large" style={{ display: "block", margin: "100px auto" }} />;
  }

  if (!bucket) {
    return (
      <Card>
        <Text type="danger">Bucket not found</Text>
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
                onClick={() => list("storage/buckets")}
              />
              <Title level={4} style={{ margin: 0 }}>
                <FolderOutlined /> {bucket.displayName}
              </Title>
            </Space>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => edit("storage/buckets", id)}
            >
              Edit
            </Button>
          </Col>
        </Row>

        <Descriptions bordered column={2}>
          <Descriptions.Item label="Display Name">{bucket.displayName}</Descriptions.Item>
          <Descriptions.Item label="Bucket Name">{bucket.name}</Descriptions.Item>
          <Descriptions.Item label="Provider ID">{bucket.providerId}</Descriptions.Item>
          <Descriptions.Item label="Region">{bucket.region}</Descriptions.Item>
          <Descriptions.Item label="Usage">
            <Tag color={usageColors[bucket.usage] || "default"}>{bucket.usage}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={bucket.isActive ? "green" : "red"}>
              {bucket.isActive ? "Active" : "Inactive"}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Used Size">{bucket.usedSizeGB} GB</Descriptions.Item>
          <Descriptions.Item label="Max Size">
            {bucket.maxSizeGB > 0 ? `${bucket.maxSizeGB} GB` : "Unlimited"}
          </Descriptions.Item>
          <Descriptions.Item label="Created At" span={2}>
            {new Date(bucket.createdAt).toLocaleString()}
          </Descriptions.Item>
        </Descriptions>
      </Space>
    </Card>
  );
}