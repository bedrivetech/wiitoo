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
  Modal,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { useState } from "react";

const { Title } = Typography;

const statusColors: Record<string, string> = {
  active: "green",
  cancelled: "red",
  expired: "default",
  pending: "gold",
};

const tierColors: Record<string, string> = {
  basic: "blue",
  premium: "purple",
  vip: "gold",
};

export default function SubscriptionsShow() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const { query, result: subscription } = useOne({
    resource: "subscriptions",
    id,
  });

  const isLoading = query.isLoading;

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const token = localStorage.getItem("access_token");
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const response = await fetch(
        `${API_BASE}/api/v1/admin/subscriptions/${id}/cancel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const json = await response.json();
      if (json.success) {
        message.success("Subscription cancelled successfully");
        setCancelModalOpen(false);
        query.refetch();
      } else {
        message.error(json.error?.message || "Failed to cancel subscription");
      }
    } catch (err: any) {
      message.error(err.message || "Failed to cancel subscription");
    } finally {
      setCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card>
        <Title level={4}>Subscription not found</Title>
        <Button onClick={() => router.push("/resources/subscriptions")}>
          Back to Subscriptions
        </Button>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push("/resources/subscriptions")}
            >
              Back
            </Button>
            <Title level={4} style={{ margin: 0 }}>
              Subscription Details
            </Title>
          </Space>

          <Descriptions bordered column={2}>
            <Descriptions.Item label="ID" span={2}>
              {subscription.id}
            </Descriptions.Item>
            <Descriptions.Item label="User ID" span={2}>
              {subscription.user_id || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Creator ID" span={2}>
              {subscription.creator_id || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Tier">
              <Tag color={tierColors[subscription.tier] || "default"}>
                {subscription.tier}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={statusColors[subscription.status] || "default"}>
                {subscription.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Amount">
              {subscription.amount != null
                ? `$${Number(subscription.amount).toFixed(2)}`
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Currency">
              {subscription.currency?.toUpperCase() || "USD"}
            </Descriptions.Item>
            <Descriptions.Item label="Provider">
              {subscription.provider || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Provider Subscription ID">
              {subscription.provider_subscription_id || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Current Period Start" span={2}>
              {subscription.current_period_start
                ? new Date(subscription.current_period_start).toLocaleString()
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Current Period End" span={2}>
              {subscription.current_period_end
                ? new Date(subscription.current_period_end).toLocaleString()
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Created At" span={2}>
              {subscription.created_at
                ? new Date(subscription.created_at).toLocaleString()
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Updated At" span={2}>
              {subscription.updated_at
                ? new Date(subscription.updated_at).toLocaleString()
                : "-"}
            </Descriptions.Item>
          </Descriptions>

          {subscription.status === "active" && (
            <Space>
              <Button
                danger
                icon={<StopOutlined />}
                onClick={() => setCancelModalOpen(true)}
              >
                Cancel Subscription
              </Button>
            </Space>
          )}
        </Space>
      </Card>

      <Modal
        title="Cancel Subscription"
        open={cancelModalOpen}
        onOk={handleCancel}
        onCancel={() => setCancelModalOpen(false)}
        okText="Confirm Cancel"
        okButtonProps={{ danger: true, loading: cancelling }}
      >
        <p>
          Are you sure you want to cancel this subscription? This action is
          irreversible and the subscription will be cancelled immediately.
        </p>
      </Modal>
    </>
  );
}