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
  Input,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  RollbackOutlined,
} from "@ant-design/icons";
import { useState } from "react";

const { Title } = Typography;

const statusColors: Record<string, string> = {
  completed: "green",
  pending: "gold",
  failed: "red",
  refunded: "blue",
  cancelled: "default",
};

export default function TransactionsShow() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [refunding, setRefunding] = useState(false);

  const { query, result: transaction } = useOne({
    resource: "transactions",
    id,
  });

  const isLoading = query.isLoading;

  const handleRefund = async () => {
    setRefunding(true);
    try {
      const token = localStorage.getItem("access_token");
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const response = await fetch(`${API_BASE}/api/v1/admin/refund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          transactionId: id,
          reason: refundReason,
        }),
      });
      const json = await response.json();
      if (json.success) {
        message.success("Refund processed successfully");
        setRefundModalOpen(false);
      } else {
        message.error(json.error?.message || "Refund failed");
      }
    } catch (err: any) {
      message.error(err.message || "Refund failed");
    } finally {
      setRefunding(false);
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

  if (!transaction) {
    return (
      <Card>
        <Title level={4}>Transaction not found</Title>
        <Button onClick={() => router.push("/resources/transactions")}>
          Back to Transactions
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
              onClick={() => router.push("/resources/transactions")}
            >
              Back
            </Button>
            <Title level={4} style={{ margin: 0 }}>
              Transaction Details
            </Title>
          </Space>

          <Descriptions bordered column={2}>
            <Descriptions.Item label="ID" span={2}>
              {transaction.id}
            </Descriptions.Item>
            <Descriptions.Item label="User ID" span={2}>
              {transaction.user_id || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Amount">
              {transaction.amount != null
                ? `$${Number(transaction.amount).toFixed(2)}`
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Currency">
              {transaction.currency?.toUpperCase() || "USD"}
            </Descriptions.Item>
            <Descriptions.Item label="Method">
              {transaction.method || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={statusColors[transaction.status] || "default"}>
                {transaction.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Description" span={2}>
              {transaction.description || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Created At" span={2}>
              {transaction.created_at
                ? new Date(transaction.created_at).toLocaleString()
                : "-"}
            </Descriptions.Item>
          </Descriptions>

          {transaction.status === "completed" && (
            <Space>
              <Button
                icon={<RollbackOutlined />}
                onClick={() => setRefundModalOpen(true)}
              >
                Process Refund
              </Button>
            </Space>
          )}
        </Space>
      </Card>

      <Modal
        title="Process Refund"
        open={refundModalOpen}
        onOk={handleRefund}
        onCancel={() => {
          setRefundModalOpen(false);
          setRefundReason("");
        }}
        okText="Process Refund"
        okButtonProps={{ danger: true, loading: refunding }}
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <p>
            Refund transaction <strong>${Number(transaction?.amount || 0).toFixed(2)}</strong>?
          </p>
          <div>
            <label>Reason:</label>
            <Input.TextArea
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="Enter refund reason"
              rows={3}
              style={{ marginTop: 4 }}
            />
          </div>
        </Space>
      </Modal>
    </>
  );
}