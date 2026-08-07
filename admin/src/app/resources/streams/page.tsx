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
  CameraOutlined,
} from "@ant-design/icons";
import { useState } from "react";

const { Title } = Typography;

const statusColors: Record<string, string> = {
  live: "red",
  ended: "default",
  scheduled: "blue",
  idle: "orange",
};

export default function StreamsList() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const { show } = useNavigation();

  const permanentFilters = [];
  if (statusFilter) {
    permanentFilters.push({ field: "status", operator: "eq" as const, value: statusFilter });
  }

  const { tableQuery, currentPage, setCurrentPage, pageSize, setPageSize } =
    useTable({
      resource: "streams",
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
      title: "Title",
      dataIndex: "title",
      key: "title",
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
      title: "User ID",
      dataIndex: "user_id",
      key: "user_id",
      ellipsis: true,
      render: (val: string) => val?.substring(0, 12) || "-",
    },
    {
      title: "Viewers",
      dataIndex: "viewer_count",
      key: "viewer_count",
      render: (val: number) => val ?? 0,
    },
    {
      title: "Started At",
      dataIndex: "started_at",
      key: "started_at",
      render: (val: string) =>
        val ? new Date(val).toLocaleString() : "-",
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => show("streams", record.id)}
          >
            View
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              <CameraOutlined /> Streams
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
                  { label: "Live", value: "live" },
                  { label: "Ended", value: "ended" },
                  { label: "Scheduled", value: "scheduled" },
                  { label: "Idle", value: "idle" },
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
            showTotal: (total: number) => `Total ${total} streams`,
          }}
          loading={isLoading}
          scroll={{ x: 900 }}
        />
      </Space>
    </Card>
  );
}