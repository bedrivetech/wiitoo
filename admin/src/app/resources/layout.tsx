"use client";

import { useMemo } from "react";
import { useGetIdentity, useNavigation } from "@refinedev/core";
import { Layout, Menu, Button, Typography, Space, Dropdown } from "antd";
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
} from "@ant-design/icons";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const { Header, Sider, Content } = Layout;
const { Text, Title } = Typography;

const menuItems = [
  { key: "/resources/users", icon: <UserOutlined />, label: "Users" },
  { key: "/resources/videos", icon: <PlayCircleOutlined />, label: "Videos" },
  { key: "/resources/streams", icon: <CameraOutlined />, label: "Streams" },
  { key: "/resources/chat-messages", icon: <MessageOutlined />, label: "Chat Messages" },
  { key: "/resources/categories", icon: <TagOutlined />, label: "Categories" },
  { key: "/resources/reports", icon: <FlagOutlined />, label: "Reports" },
  { key: "/resources/transactions", icon: <DollarOutlined />, label: "Transactions" },
  { key: "/resources/payouts", icon: <BankOutlined />, label: "Payouts" },
  { key: "/resources/subscriptions", icon: <TeamOutlined />, label: "Subscriptions" },
  { key: "/resources/templates", icon: <FileTextOutlined />, label: "Templates" },
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

function getSelectedKey(pathname: string): string {
  // Match the resource part of the path
  for (const item of menuItems) {
    // Handle nested items
    if (item.children) {
      for (const child of item.children) {
        if (pathname.startsWith(child.key)) {
          return child.key;
        }
      }
    }
    if (item.key && pathname.startsWith(item.key)) {
      return item.key;
    }
  }
  return "/resources/users";
}

function getOpenKeys(pathname: string): string[] {
  const keys: string[] = [];
  for (const item of menuItems) {
    if (item.children) {
      for (const child of item.children) {
        if (pathname.startsWith(child.key)) {
          keys.push(item.key);
        }
      }
    }
  }
  return keys;
}

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

  const handleMenuClick = (info: { key: string }) => {
    router.push(info.key);
  };

  const handleLogout = async () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        width={220}
        style={{
          overflow: "auto",
          height: "100vh",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <Title
            level={4}
            style={{
              color: "#fff",
              margin: 0,
              fontSize: collapsed ? 14 : 18,
              whiteSpace: "nowrap",
            }}
          >
            {collapsed ? "FP" : "Fusion Admin"}
          </Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          defaultOpenKeys={openKeys}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 220, transition: "margin-left 0.2s" }}>
        <Header
          style={{
            padding: "0 24px",
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <Space>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
            />
            <Text strong style={{ fontSize: 16 }}>
              {menuItems.find((item) => item.key === selectedKey)?.label || "Dashboard"}
            </Text>
          </Space>
          <Space>
            <Text type="secondary">
              {identity?.display_name || identity?.email || "Admin"}
            </Text>
            <Dropdown
              menu={{
                items: [
                  {
                    key: "logout",
                    icon: <LogoutOutlined />,
                    label: "Logout",
                    onClick: handleLogout,
                  },
                ],
              }}
            >
              <Button type="text" icon={<UserOutlined />} />
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ margin: 24, minHeight: 280 }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}