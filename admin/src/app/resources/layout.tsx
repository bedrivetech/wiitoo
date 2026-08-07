"use client";

import { useMemo, useState } from "react";
import { useGetIdentity, useNavigation } from "@refinedev/core";
import {
  Layout,
  Menu,
  Button,
  Typography,
  Space,
  Dropdown,
  Avatar,
  Breadcrumb,
  Tooltip,
} from "antd";
import {
  UserOutlined,
  PlayCircleOutlined,
  CameraOutlined,
  MessageOutlined,
  TagOutlined,
  FlagOutlined,
  DollarOutlined,
  BankOutlined,
  TeamOutlined,
  FileTextOutlined,
  MailOutlined,
  HddOutlined,
  FolderOutlined,
  SwapOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SunOutlined,
  MoonOutlined,
  SearchOutlined,
  DashboardOutlined,
  HomeOutlined,
  RightOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { usePathname, useRouter } from "next/navigation";
import { useKBar } from "@refinedev/kbar";
import { RefineKbar } from "@refinedev/kbar";
import { useDarkMode } from "@/lib/use-dark-mode";
import { wiitooBrand, darkTokens } from "@/lib/theme";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

// ---------------------------------------------------------------------------
// Menu items
// ---------------------------------------------------------------------------

const menuItems = [
  { key: "/", icon: <DashboardOutlined />, label: "Dashboard" },
  { key: "/resources/users", icon: <UserOutlined />, label: "Users" },
  { key: "/resources/videos", icon: <PlayCircleOutlined />, label: "Videos" },
  { key: "/resources/streams", icon: <CameraOutlined />, label: "Streams" },
  {
    key: "/resources/chat-messages",
    icon: <MessageOutlined />,
    label: "Chat Messages",
  },
  { key: "/resources/categories", icon: <TagOutlined />, label: "Categories" },
  { key: "/resources/reports", icon: <FlagOutlined />, label: "Reports" },
  {
    key: "/resources/transactions",
    icon: <DollarOutlined />,
    label: "Transactions",
  },
  { key: "/resources/payouts", icon: <BankOutlined />, label: "Payouts" },
  {
    key: "/resources/subscriptions",
    icon: <TeamOutlined />,
    label: "Subscriptions",
  },
  {
    key: "/resources/templates",
    icon: <FileTextOutlined />,
    label: "Templates",
  },
  {
    key: "/resources/creator-verification",
    icon: <CheckCircleOutlined />,
    label: "Creator Verification",
  },
  {
    key: "/resources/email",
    icon: <MailOutlined />,
    label: "Email",
  },
  {
    key: "storage",
    icon: <HddOutlined />,
    label: "Storage",
    children: [
      {
        key: "/resources/storage/providers",
        icon: <HddOutlined />,
        label: "Providers",
      },
      {
        key: "/resources/storage/buckets",
        icon: <FolderOutlined />,
        label: "Buckets",
      },
      {
        key: "/resources/storage/routing",
        icon: <SwapOutlined />,
        label: "Routing",
      },
    ],
  },
];

// Not sure if email is linked to creator-verification above or a separate resource.
// Keep the storage section as-is; also handle path matching.

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Find the menu item (or child) that matches the current pathname. */
function getSelectedKey(pathname: string): string {
  for (const item of menuItems) {
    if (item.children) {
      for (const child of item.children) {
        if (pathname.startsWith(child.key)) return child.key;
      }
    }
    if (item.key !== "storage" && pathname.startsWith(item.key)) return item.key;
  }
  return "/";
}

/** Collect open sub-menu keys. */
function getOpenKeys(pathname: string): string[] {
  const keys: string[] = [];
  for (const item of menuItems) {
    if (item.children) {
      for (const child of item.children) {
        if (pathname.startsWith(child.key)) keys.push(item.key);
      }
    }
  }
  return keys;
}

/** Build breadcrumb items from pathname. */
function buildBreadcrumb(pathname: string) {
  const items: { title: React.ReactNode }[] = [
    { title: <><HomeOutlined /> Home</> },
  ];

  if (pathname === "/") return items;

  // Try to find a matching menu label
  let matched: string | undefined;
  let parentLabel: string | undefined;

  for (const item of menuItems) {
    if (item.children) {
      for (const child of item.children) {
        if (pathname.startsWith(child.key)) {
          matched = child.label as string;
          parentLabel = item.label as string;
          break;
        }
      }
    } else if (item.key !== "storage" && pathname.startsWith(item.key)) {
      matched = item.label as string;
    }
  }

  if (parentLabel) {
    items.push({ title: parentLabel });
  }
  if (matched) {
    items.push({ title: matched });
  }

  return items;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ResourcesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const selectedKey = getSelectedKey(pathname);
  const openKeys = getOpenKeys(pathname);
  const { data: identity } = useGetIdentity<any>();
  const { isDark, toggleDark } = useDarkMode();
  const { query } = useKBar();

  const handleMenuClick = (info: { key: string }) => {
    router.push(info.key);
  };

  const handleLogout = async () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const breadcrumbItems = useMemo(() => buildBreadcrumb(pathname), [pathname]);

  // User display name / avatar fallback
  const userName =
    identity?.display_name || identity?.email || "Admin";
  const userAvatarLetter = userName.charAt(0).toUpperCase();

  return (
    <Layout style={{ minHeight: "100vh", background: "transparent" }}>
      {/* ---- Sidebar (always dark) ---- */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        width={240}
        collapsedWidth={64}
        style={{
          overflow: "auto",
          height: "100vh",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          background: darkTokens.sidebar,
          borderRight: `1px solid ${darkTokens.border}`,
          zIndex: 100,
        }}
      >
        {/* Logo */}
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            padding: collapsed ? 0 : "0 20px",
            borderBottom: `1px solid ${darkTokens.border}`,
            gap: 10,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: `linear-gradient(135deg, ${wiitooBrand.primary}, ${wiitooBrand.secondary})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 14,
              color: "#fff",
              flexShrink: 0,
            }}
          >
            F
          </div>
          {!collapsed && (
            <Text
              strong
              style={{
                color: "#fff",
                fontSize: 18,
                letterSpacing: 2,
                whiteSpace: "nowrap",
              }}
            >
              FUSION
            </Text>
          )}
        </div>

        {/* Navigation */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          defaultOpenKeys={openKeys}
          items={menuItems}
          onClick={handleMenuClick}
          style={{
            background: "transparent",
            borderRight: 0,
            paddingTop: 8,
          }}
        />
      </Sider>

      {/* ---- Main area ---- */}
      <Layout
        style={{
          marginLeft: collapsed ? 64 : 240,
          transition: "margin-left 0.2s ease",
          background: "transparent",
        }}
      >
        {/* ---- Header ---- */}
        <Header
          style={{
            padding: "0 24px",
            background: isDark ? darkTokens.surface : "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: `1px solid ${isDark ? darkTokens.border : "#e5e7eb"}`,
            boxShadow: isDark
              ? "0 1px 3px rgba(0,0,0,0.3)"
              : "0 1px 3px rgba(0,0,0,0.06)",
            position: "sticky",
            top: 0,
            zIndex: 50,
            height: 64,
            transition: "background 0.3s ease, border-color 0.3s ease",
          }}
        >
          {/* Left: hamburger + breadcrumb */}
          <Space size="middle">
            <Button
              type="text"
              icon={
                collapsed ? (
                  <MenuUnfoldOutlined style={{ fontSize: 18 }} />
                ) : (
                  <MenuFoldOutlined style={{ fontSize: 18 }} />
                )
              }
              onClick={() => setCollapsed(!collapsed)}
              style={{
                color: isDark ? darkTokens.text : "#1a1a2e",
              }}
            />
            <Breadcrumb
              items={breadcrumbItems}
              style={{
                fontSize: 14,
              }}
            />
          </Space>

          {/* Right: actions */}
          <Space size="small">
            {/* Dark mode toggle */}
            <Tooltip title={isDark ? "Light mode" : "Dark mode"}>
              <Button
                type="text"
                icon={
                  isDark ? (
                    <SunOutlined style={{ fontSize: 18, color: wiitooBrand.accent }} />
                  ) : (
                    <MoonOutlined style={{ fontSize: 18, color: "#6b7280" }} />
                  )
                }
                onClick={toggleDark}
              />
            </Tooltip>

            {/* Cmd+K search */}
            <Tooltip title="Search (⌘K)">
              <Button
                type="text"
                icon={
                  <SearchOutlined
                    style={{
                      fontSize: 18,
                      color: isDark ? darkTokens.text : "#1a1a2e",
                    }}
                  />
                }
                onClick={() => query?.toggle()}
              />
            </Tooltip>

            {/* User avatar dropdown */}
            <Dropdown
              menu={{
                items: [
                  {
                    key: "profile",
                    icon: <UserOutlined />,
                    label: "Profile",
                    disabled: true,
                  },
                  { type: "divider" },
                  {
                    key: "logout",
                    icon: <LogoutOutlined />,
                    label: "Logout",
                    onClick: handleLogout,
                    danger: true,
                  },
                ],
              }}
              placement="bottomRight"
            >
              <Space
                style={{ cursor: "pointer", padding: "4px 8px", borderRadius: 8 }}
              >
                <Avatar
                  size="small"
                  style={{
                    background: `linear-gradient(135deg, ${wiitooBrand.primary}, ${wiitooBrand.secondary})`,
                    color: "#fff",
                    fontWeight: 600,
                  }}
                >
                  {userAvatarLetter}
                </Avatar>
                <Text
                  style={{
                    color: isDark ? darkTokens.text : "#1a1a2e",
                    fontSize: 14,
                  }}
                >
                  {userName}
                </Text>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {/* ---- Content ---- */}
        <Content
          style={{
            margin: 0,
            padding: 24,
            minHeight: 280,
            animation: "fadeIn 0.3s ease",
          }}
        >
          <div className="animate-fade-in">{children}</div>
        </Content>
      </Layout>

      {/* ---- KBar command palette ---- */}
      <RefineKbar />
    </Layout>
  );
}