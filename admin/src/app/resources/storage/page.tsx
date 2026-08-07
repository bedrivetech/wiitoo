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
  Statistic,
  Popconfirm,
  message,
} from "antd";
import {
  HddOutlined,
  PlusOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";

const { Title } = Typography;

export default function StorageDashboard() {
  const { create } = useNavigation();
  const [stats, setStats] = useState<any>(null);

  const { tableQuery, currentPage, setCurrentPage, pageSize, setPageSize } = useTable({
    resource: "storage/providers",
    pagination: { currentPage: 1, pageSize: 20 },
  });

  const providers = tableQuery?.data?.data || [];
  const total = tableQuery?.data?.total || 0;

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    fetch(`${API_BASE}/api/v1/admin/storage/stats`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-User-Role": "admin",
      },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setStats(json.data);
      })
      .catch(() => {});
  }, []);

  const handleHealthCheck = () => {
    const token = localStorage.getItem("access_token");
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    fetch(`${API_BASE}/api/v1/admin/storage/health`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-User-Role": "admin",
      },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          message.success("Health check completed");
          tableQuery.refetch();
        }
      })
      .catch((err) => message.error(err.message));
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name: string) => (
        <span><HddOutlined /> {name}</span>
      ),
    },
    {
      title: "Type",
      dataIndex: "providerType",
      key: "providerType",
      render: (t: string) => <Tag>{t}</Tag>,
    },
    {
      title: "Region",
      dataIndex: "defaultRegion",
      key: "defaultRegion",
    },
    {
      title: "Status",
      key: "status",
      render: (_: any, r: any) => (
        <Space>
          <Tag color={r.isActive ? "green" : "red"}>
            {r.isActive ? "Active" : "Inactive"}
          </Tag>
          {r.isHealthy ? (
            <Tag icon={<CheckCircleOutlined />} color="success">Healthy</Tag>
          ) : (
            <Tag icon={<CloseCircleOutlined />} color="error">Unhealthy</Tag>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      {stats && (
        <Row gutter={16}>
          <Col span={4}>
            <Card>
              <Statistic title="Providers" value={stats.totalProviders} suffix={`(${stats.activeProviders} active)`} />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic title="Buckets" value={stats.totalBuckets} />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic title="Total Size" value={stats.totalSizeGB} suffix="GB" />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic title="Healthy" value={stats.healthyCount} valueStyle={{ color: "#3f8600" }} />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic title="Unhealthy" value={stats.unhealthyCount} valueStyle={{ color: "#cf1322" }} />
            </Card>
          </Col>
        </Row>
      )}

      <Card>
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={4} style={{ margin: 0 }}>
                <HddOutlined /> Storage Providers
              </Title>
            </Col>
            <Col>
              <Space>
                <Button icon={<ReloadOutlined />} onClick={handleHealthCheck}>
                  Health Check
                </Button>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => create("storage/providers")}
                >
                  Add Provider
                </Button>
              </Space>
            </Col>
          </Row>

          <Table
            dataSource={providers}
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
              showTotal: (total: number) => `Total ${total} providers`,
            }}
            scroll={{ x: 800 }}
          />
        </Space>
      </Card>
    </Space>
  );
}