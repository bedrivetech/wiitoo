"use client";

import { useTable } from "@refinedev/core";
import {
  Table,
  Tag,
  Card,
  Typography,
  Row,
  Col,
  Space,
  Select,
  DatePicker,
} from "antd";
import { FileTextOutlined } from "@ant-design/icons";
import { useState } from "react";

const { Title } = Typography;
const { RangePicker } = DatePicker;

const statusColors: Record<string, string> = {
  sent: "green",
  failed: "red",
  bounced: "orange",
};

export default function EmailLogPage() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  const { tableQuery, currentPage, setCurrentPage, pageSize, setPageSize } =
    useTable({
      resource: "email/log",
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
      title: "To",
      dataIndex: "toEmail",
      key: "toEmail",
      ellipsis: true,
    },
    {
      title: "Subject",
      dataIndex: "subject",
      key: "subject",
      ellipsis: true,
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
      title: "Error",
      dataIndex: "error",
      key: "error",
      ellipsis: true,
      render: (err: string | null) => err || "-",
    },
    {
      title: "Provider",
      dataIndex: "providerId",
      key: "providerId",
      render: (id: string | null) =>
        id ? (
          <Tag>{id.substring(0, 8)}...</Tag>
        ) : (
          "-"
        ),
    },
    {
      title: "Sent At",
      dataIndex: "sentAt",
      key: "sentAt",
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
              <FileTextOutlined /> Email Log
            </Title>
          </Col>
          <Col>
            <Space>
              <Select
                placeholder="Status"
                value={statusFilter}
                onChange={setStatusFilter}
                allowClear
                style={{ width: 130 }}
                options={[
                  { label: "Sent", value: "sent" },
                  { label: "Failed", value: "failed" },
                  { label: "Bounced", value: "bounced" },
                ]}
              />
            </Space>
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
            showTotal: (total: number) => `Total ${total} emails`,
          }}
          loading={isLoading}
          scroll={{ x: 900 }}
        />
      </Space>
    </Card>
  );
}