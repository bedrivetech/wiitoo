"use client";

import {
  UserOutlined,
  CameraOutlined,
  PlayCircleOutlined,
  DollarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  PlusOutlined,
  FlagOutlined,
  BankOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useList } from "@refinedev/core";
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Table,
  Tag,
  Typography,
  Spin,
  Empty,
  Flex,
} from "antd";
import { useRouter } from "next/navigation";
import { wiitooBrand } from "@/lib/theme";
import { useDarkMode } from "@/lib/use-dark-mode";
import { darkTokens } from "@/lib/theme";

const { Text, Title } = Typography;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ActivityItem {
  key: string;
  timestamp: string;
  type: "signup" | "stream" | "transaction";
  description: string;
  status: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const statusColors: Record<string, string> = {
  completed: "green",
  pending: "gold",
  active: "blue",
  cancelled: "red",
  failed: "red",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const router = useRouter();
  const { isDark } = useDarkMode();

  // Fetch data — Refine v5 useList returns { query, result, ... }
  const { result: usersResult, query: usersQuery } = useList({
    resource: "users",
    pagination: { currentPage: 1, pageSize: 5 },
    meta: { select: "id,email,created_at,display_name" },
  });

  const { result: streamsResult, query: streamsQuery } = useList({
    resource: "streams",
    pagination: { currentPage: 1, pageSize: 5 },
  });

  const { result: videosResult, query: videosQuery } = useList({
    resource: "videos",
    pagination: { currentPage: 1, pageSize: 1 },
  });

  const { result: transactionsResult, query: transactionsQuery } = useList({
    resource: "transactions",
    pagination: { currentPage: 1, pageSize: 10 },
  });

  const isLoading =
    usersQuery.isLoading ||
    streamsQuery.isLoading ||
    videosQuery.isLoading ||
    transactionsQuery.isLoading;

  // Compute KPI values
  const usersData = usersResult?.data || [];
  const totalUsers = usersResult?.total ?? 0;
  const totalStreams = streamsResult?.total ?? 0;
  const totalVideos = videosResult?.total ?? 0;
  const txRecords = transactionsResult?.data || [];

  // Compute approximate revenue from transactions
  let revenue = 0;
  for (const tx of txRecords) {
    const amount = parseFloat(tx?.amount ?? tx?.value ?? 0);
    if (!isNaN(amount)) revenue += amount;
  }

  // Build activity feed
  const activity: ActivityItem[] = [];

  // Recent signups
  for (const u of usersData.slice(0, 3)) {
    activity.push({
      key: `user-${u.id}`,
      timestamp: u.created_at || new Date().toISOString(),
      type: "signup",
      description: `New user: ${u.display_name || u.email || u.id}`,
      status: "active",
    });
  }

  // Recent streams
  const recentStreams = streamsResult?.data || [];
  for (const s of recentStreams.slice(0, 3)) {
    activity.push({
      key: `stream-${s.id}`,
      timestamp: s.created_at || s.started_at || new Date().toISOString(),
      type: "stream",
      description: `Stream: ${s.title || s.id}`,
      status: s.status || "active",
    });
  }

  // Recent transactions
  for (const tx of txRecords.slice(0, 4)) {
    activity.push({
      key: `tx-${tx.id}`,
      timestamp: tx.created_at || new Date().toISOString(),
      type: "transaction",
      description: `Transaction ${tx.id} — ${formatCurrency(
        parseFloat(tx?.amount ?? tx?.value ?? 0)
      )}`,
      status: tx.status || "completed",
    });
  }

  // Sort by timestamp descending
  activity.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const activityColumns = [
    {
      title: "Timestamp",
      dataIndex: "timestamp",
      key: "timestamp",
      width: 120,
      render: (val: string) => (
        <Text type="secondary" style={{ fontSize: 13 }}>
          {formatTimeAgo(val)}
        </Text>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 120,
      render: (val: string) => {
        const config: Record<string, { color: string; label: string }> = {
          signup: { color: "cyan", label: "Signup" },
          stream: { color: "blue", label: "Stream" },
          transaction: { color: "green", label: "Transaction" },
        };
        const c = config[val] ?? { color: "default", label: val };
        return <Tag color={c.color}>{c.label}</Tag>;
      },
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 110,
      render: (val: string) => {
        const color = statusColors[val?.toLowerCase()] || "default";
        return <Tag color={color}>{val?.toUpperCase() || "UNKNOWN"}</Tag>;
      },
    },
  ];

  // KPI card helper
  const kpiCard = (
    title: string,
    value: number | string,
    icon: React.ReactNode,
    trend: "up" | "down" | null,
    trendLabel: string,
    loading: boolean
  ) => (
    <Col xs={24} sm={12} lg={6}>
      <div className="dashboard-card">
        <Card
          hoverable
          loading={loading}
          style={{
            borderRadius: 12,
            border: `1px solid ${isDark ? darkTokens.border : "#e5e7eb"}`,
            background: isDark ? darkTokens.surface : "#ffffff",
          }}
          styles={{ body: { padding: "20px 24px" } }}
        >
          <Flex justify="space-between" align="flex-start">
            <div>
              <Text
                type="secondary"
                style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 4 }}
              >
                {title}
              </Text>
              <div style={{ fontSize: 28, fontWeight: 700, color: isDark ? darkTokens.text : "#1a1a2e", lineHeight: 1.2 }}>
                {value}
              </div>
            </div>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: `rgba(124, 58, 237, 0.1)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                color: wiitooBrand.primary,
              }}
            >
              {icon}
            </div>
          </Flex>
          {trend && (
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}>
              {trend === "up" ? (
                <ArrowUpOutlined style={{ color: wiitooBrand.success, fontSize: 12 }} />
              ) : (
                <ArrowDownOutlined style={{ color: wiitooBrand.danger, fontSize: 12 }} />
              )}
              <Text
                style={{
                  fontSize: 12,
                  color: trend === "up" ? wiitooBrand.success : wiitooBrand.danger,
                }}
              >
                {trendLabel}
              </Text>
            </div>
          )}
        </Card>
      </div>
    </Col>
  );

  return (
    <div>
      {/* Page title */}
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0, color: isDark ? darkTokens.text : undefined }}>
          Dashboard
        </Title>
        <Text type="secondary">Overview of your platform activity</Text>
      </div>

      {isLoading ? (
        <div style={{ textAlign: "center", padding: 80 }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          {/* ---- KPI Cards ---- */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            {kpiCard(
              "Total Users",
              totalUsers,
              <UserOutlined />,
              totalUsers > 0 ? "up" : null,
              `${totalUsers > 0 ? "+" : ""}${totalUsers > 12 ? 12 : totalUsers} this week`,
              usersQuery.isLoading
            )}
            {kpiCard(
              "Active Streams",
              totalStreams,
              <CameraOutlined />,
              totalStreams > 0 ? "up" : null,
              `${totalStreams} live now`,
              streamsQuery.isLoading
            )}
            {kpiCard(
              "Videos",
              totalVideos,
              <PlayCircleOutlined />,
              null,
              `${totalVideos} total videos`,
              videosQuery.isLoading
            )}
            {kpiCard(
              "Revenue",
              `$${revenue.toLocaleString()}`,
              <DollarOutlined />,
              revenue > 0 ? "up" : null,
              revenue > 0 ? "+12% vs last month" : "No transactions yet",
              transactionsQuery.isLoading
            )}
          </Row>

          {/* ---- Quick Actions ---- */}
          <Card
            style={{
              marginBottom: 24,
              borderRadius: 12,
              border: `1px solid ${isDark ? darkTokens.border : "#e5e7eb"}`,
              background: isDark ? darkTokens.surface : "#ffffff",
            }}
            styles={{ body: { padding: "16px 24px" } }}
          >
            <Text
              strong
              style={{
                display: "block",
                marginBottom: 16,
                color: isDark ? darkTokens.text : undefined,
              }}
            >
              Quick Actions
            </Text>
            <Space wrap size="middle">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => router.push("/resources/users/create")}
                style={{
                  background: wiitooBrand.primary,
                  borderColor: wiitooBrand.primary,
                  boxShadow: `0 2px 8px rgba(124,58,237,0.3)`,
                }}
              >
                Create User
              </Button>
              <Button
                icon={<FlagOutlined />}
                onClick={() => router.push("/resources/reports")}
              >
                View Pending Reports
              </Button>
              <Button
                icon={<BankOutlined />}
                onClick={() => router.push("/resources/payouts/create")}
              >
                Trigger Payouts
              </Button>
              <Button
                icon={<EyeOutlined />}
                onClick={() => router.push("/resources/streams")}
              >
                View Live Streams
              </Button>
            </Space>
          </Card>

          {/* ---- Activity Table ---- */}
          <Card
            title={
              <Text strong style={{ color: isDark ? darkTokens.text : undefined }}>
                Recent Activity
              </Text>
            }
            style={{
              borderRadius: 12,
              border: `1px solid ${isDark ? darkTokens.border : "#e5e7eb"}`,
              background: isDark ? darkTokens.surface : "#ffffff",
            }}
            styles={{ body: { padding: 0 } }}
          >
            {activity.length === 0 ? (
              <div style={{ padding: "60px 0" }}>
                <Empty description="No recent activity" />
              </div>
            ) : (
              <Table
                dataSource={activity}
                columns={activityColumns}
                pagination={false}
                showHeader={false}
                size="small"
                style={{ background: "transparent" }}
              />
            )}
          </Card>
        </>
      )}
    </div>
  );
}