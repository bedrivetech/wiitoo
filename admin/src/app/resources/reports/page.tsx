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
  message,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  FlagOutlined,
} from "@ant-design/icons";
import { useState } from "react";

const { Title } = Typography;
const { show } = useNavigation();

const statusColors: Record<string, string> = {
  pending: "gold",
  resolved: "green",
  dismissed: "default",
};

const reportTypeColors: Record<string, string> = {
  spam: "red",
  harassment: "orange",
  inappropriate: "purple",
  copyright: "blue",
  other: "default",
};

export default function ReportsList() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  const permanentFilters = [];
  if (statusFilter) {
    permanentFilters.push({ field: "status", operator: "eq" as const, value: statusFilter });
  }

  const { tableQuery, currentPage, setCurrentPage, pageSize, setPageSize } =
    useTable({
      resource: "reports",
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

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const token = localStorage.getItem("access_token");
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const response = await fetch(`${API_BASE}/api/v1/admin/reports/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const json = await response.json();
      if (json.success) {
        message.success(`Report ${status}`);
        tableQuery.refetch();
      } else {
        message.error(json.error?.message || "Failed to update report");
      }
    } catch (err: any) {
      message.error(err.message || "Failed to update report");
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
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type: string) => (
        <Tag color={reportTypeColors[type] || "default"}>{type}</Tag>
      ),
    },
    {
      title: "Reporter",
      dataIndex: "reporter_id",
      key: "reporter_id",
      render: (val: string) => val?.substring(0, 12) || "-",
    },
    {
      title: "Target",
      dataIndex: "target_id",
      key: "target_id",
      render: (val: string) => val?.substring(0, 12) || "-",
    },
    {
      title: "Reason",
      dataIndex: "reason",
      key: "reason",
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
      title: "Created At",
      dataIndex: "created_at",
      key: "created_at",
      render: (val: string) =>
        val ? new Date(val).toLocaleString() : "-",
    },
    {
      title: "Actions",
      key: "actions",
      width: 280,
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => show("reports", record.id)}
          >
            View
          </Button>
          {record.status === "pending" ? (
            <>
              <Button
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleUpdateStatus(record.id, "resolved")}
              >
                Resolve
              </Button>
              <Button
                size="small"
                icon={<CloseCircleOutlined />}
                onClick={() => handleUpdateStatus(record.id, "dismissed")}
              >
                Dismiss
              </Button>
            </>
          ) : (
            <Tag color={statusColors[record.status]}>{record.status}</Tag>
          )}
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
              <FlagOutlined /> Reports
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
                { label: "Pending", value: "pending" },
                { label: "Resolved", value: "resolved" },
                { label: "Dismissed", value: "dismissed" },
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
            showTotal: (total: number) => `Total ${total} reports`,
          }}
          loading={isLoading}
          scroll={{ x: 900 }}
        />
      </Space>
    </Card>
  );
}