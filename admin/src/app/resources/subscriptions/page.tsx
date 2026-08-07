"use client";

import { useTable } from "@refinedev/core";
import {
  Table,
  Button,
  Space,
  Tag,
  Card,
  Typography,
  Row,
  Col,
  Popconfirm,
  message,
} from "antd";
import {
  StopOutlined,
  TeamOutlined,
} from "@ant-design/icons";

const { Title } = Typography;

const statusColors: Record<string, string> = {
  active: "green",
  cancelled: "red",
  expired: "default",
  pending: "gold",
};

export default function SubscriptionsList() {
  const { tableQuery, currentPage, setCurrentPage, pageSize, setPageSize } =
    useTable({
      resource: "subscriptions",
      pagination: {
        currentPage: 1,
        pageSize: 20,
      },
    });

  const data = tableQuery?.data?.data || [];
  const total = tableQuery?.data?.total || 0;
  const isLoading = tableQuery?.isLoading || false;

  const handleCancel = async (id: string) => {
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
        message.success("Subscription cancelled");
        tableQuery.refetch();
      } else {
        message.error(json.error?.message || "Failed to cancel subscription");
      }
    } catch (err: any) {
      message.error(err.message || "Failed to cancel subscription");
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 100,
      render: (id: string) => id?.substring(0, 8) || "-",
    },
    {
      title: "User ID",
      dataIndex: "user_id",
      key: "user_id",
      render: (val: string) => val?.substring(0, 12) || "-",
    },
    {
      title: "Plan",
      dataIndex: "plan",
      key: "plan",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={statusColors[status] || "default"}>{status}</Tag>
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (val: number) =>
        val != null ? `$${Number(val).toFixed(2)}` : "-",
    },
    {
      title: "Start Date",
      dataIndex: "start_date",
      key: "start_date",
      render: (val: string) =>
        val ? new Date(val).toLocaleDateString() : "-",
    },
    {
      title: "End Date",
      dataIndex: "end_date",
      key: "end_date",
      render: (val: string) =>
        val ? new Date(val).toLocaleDateString() : "-",
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_: any, record: any) =>
        record.status === "active" ? (
          <Popconfirm
            title="Cancel this subscription?"
            description="This will cancel the subscription immediately."
            onConfirm={() => handleCancel(record.id)}
          >
            <Button danger size="small" icon={<StopOutlined />}>
              Cancel
            </Button>
          </Popconfirm>
        ) : (
          <Tag>{record.status}</Tag>
        ),
    },
  ];

  return (
    <Card>
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              <TeamOutlined /> Subscriptions
            </Title>
          </Col>
        </Row>

        <Table
          dataSource={data}
          columns={columns}
          rowKey="id"
          pagination={{
            current: currentPage,
            pageSize,
            total,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            },
            showSizeChanger: true,
            showTotal: (total: number) => `Total ${total} subscriptions`,
          }}
          loading={isLoading}
          scroll={{ x: 900 }}
        />
      </Space>
    </Card>
  );
}