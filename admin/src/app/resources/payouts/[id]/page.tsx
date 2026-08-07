"use client";

import { useOne } from "@refinedev/core";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Typography,
  Spin,
} from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";

const { Title } = Typography;

const statusColors: Record<string, string> = {
  completed: "green",
  pending: "gold",
  failed: "red",
  processing: "blue",
};

export default function PayoutsShow() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { query, result: payout } = useOne({
    resource: "payouts",
    id,
  });

  const isLoading = query.isLoading;

  if (isLoading) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (!payout) {
    return (
      <Card>
        <Title level={4}>Payout not found</Title>
        <Button onClick={() => router.push("/resources/payouts")}>
          Back to Payouts
        </Button>
      </Card>
    );
  }

  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push("/resources/payouts")}
          >
            Back
          </Button>
          <Title level={4} style={{ margin: 0 }}>
            Payout Details
          </Title>
        </Space>

        <Descriptions bordered column={2}>
          <Descriptions.Item label="ID" span={2}>
            {payout.id}
          </Descriptions.Item>
          <Descriptions.Item label="Creator ID" span={2}>
            {payout.creator_id || "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Amount">
            {payout.amount != null
              ? `$${Number(payout.amount).toFixed(2)}`
              : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Currency">
            {payout.currency?.toUpperCase() || "USD"}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={statusColors[payout.status] || "default"}>
              {payout.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Provider">
            {payout.provider || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Provider Payout ID" span={2}>
            {payout.provider_payout_id || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Created At" span={2}>
            {payout.created_at
              ? new Date(payout.created_at).toLocaleString()
              : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Updated At" span={2}>
            {payout.updated_at
              ? new Date(payout.updated_at).toLocaleString()
              : "-"}
          </Descriptions.Item>
        </Descriptions>
      </Space>
    </Card>
  );
}