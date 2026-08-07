"use client";

import { useTable, useNavigation } from "@refinedev/core";
import {
  Table,
  Button,
  Space,
  Tag,
  Select,
  Card,
  Typography,
  Row,
  Col,
} from "antd";
import {
  EyeOutlined,
  DollarOutlined,
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

export default function TransactionsList() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const { show } = useNavigation();

  const permanentFilters = [];
  if (statusFilter) {
    permanentFilters.push({ field: "status", operator: "eq" as const, value: statusFilter });
  }

  const { tableQuery, currentPage, setCurrentPage, pageSize, setPageSize } =
    useTable({
      resource: "transactions",
      filters: {
        permanent: permanentFilters,
      },
      pagination: {
        currentPage: 1,
        pageSize: 20,
      },
    });

  const data = tableQuery?.data?.data || [];
  const total = tableQuery?.data?.total || 0;
  const isLoading = tableQuery?.isLoading || false;

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
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (val: number) =>
        val != null ? `$${Number(val).toFixed(2)}` : "-",
    },
    {
      title: "Currency",
      dataIndex: "currency",
      key: "currency",
      render: (val: string) => val?.toUpperCase() || "USD",
    },
    {
      title: "Method",
      dataIndex: "method",
      key: "method",
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
      title: "Created At",
      dataIndex: "created_at",
      key: "created_at",
      render: (val: string) =>
        val ? new Date(val).toLocaleString() : "-",
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      render: (_: any, record: any) => (
        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => show("transactions", record.id)}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <Card>
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              <DollarOutlined /> Transactions
            </Title>
          </Col>
          <Col>
            <Select
              placeholder="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
              style={{ width: 130 }}
              options={[
                { label: "Completed", value: "completed" },
                { label: "Pending", value: "pending" },
                { label: "Failed", value: "failed" },
                { label: "Refunded", value: "refunded" },
                { label: "Cancelled", value: "cancelled" },
              ]}
            />
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
            showTotal: (total: number) => `Total ${total} transactions`,
          }}
          loading={isLoading}
          scroll={{ x: 900 }}
        />
      </Space>
    </Card>
  );
}