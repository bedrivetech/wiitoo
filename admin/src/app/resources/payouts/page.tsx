"use client";

import { useTable, useNavigation } from "@refinedev/core";
import {
  Table,
  Button,
  Space,
  Tag,
  Card,
  Typography,
  Row,
  Col,
} from "antd";
import {
  PlusOutlined,
  BankOutlined,
} from "@ant-design/icons";

const { Title } = Typography;

const statusColors: Record<string, string> = {
  completed: "green",
  pending: "gold",
  failed: "red",
  processing: "blue",
};

export default function PayoutsList() {
  const { create } = useNavigation();

  const { tableQuery, currentPage, setCurrentPage, pageSize, setPageSize } =
    useTable({
      resource: "payouts",
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
      title: "Creator ID",
      dataIndex: "creator_id",
      key: "creator_id",
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
  ];

  return (
    <Card>
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              <BankOutlined /> Payouts
            </Title>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => create("payouts")}
            >
              Trigger Payout
            </Button>
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
            showTotal: (total: number) => `Total ${total} payouts`,
          }}
          loading={isLoading}
          scroll={{ x: 700 }}
        />
      </Space>
    </Card>
  );
}