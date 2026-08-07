"use client";

import { useState } from "react";
import { useLogin } from "@refinedev/core";
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Alert,
  Space,
  Divider,
} from "antd";
import {
  LockOutlined,
  MailOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { wiitooBrand } from "@/lib/theme";

const { Title, Text } = Typography;

export default function LoginPage() {
  const { mutate: login, isPending } = useLogin();
  const [error, setError] = useState<string | null>(null);

  const onFinish = (values: { email: string; password: string }) => {
    setError(null);
    login(values, {
      onError: (err) => {
        setError(err?.message || "Login failed. Please try again.");
      },
    });
  };

  return (
    <div style={styles.wrapper}>
      {/* Animated gradient background */}
      <div style={styles.bg} />

      {/* Card */}
      <div style={styles.cardContainer}>
        <Card
          style={styles.card}
          bodyStyle={{ padding: "40px 36px" }}
        >
          <Space
            direction="vertical"
            size="middle"
            style={{ width: "100%", textAlign: "center" }}
          >
            {/* Logo */}
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: `linear-gradient(135deg, ${wiitooBrand.primary}, ${wiitooBrand.secondary})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 8px",
                boxShadow: `0 4px 16px rgba(124,58,237,0.35)`,
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontSize: 24,
                  fontWeight: 800,
                  letterSpacing: 1,
                }}
              >
                F
              </Text>
            </div>

            <Title level={3} style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
              FUSION
            </Title>
            <Text
              type="secondary"
              style={{
                display: "block",
                marginTop: -4,
                fontSize: 14,
                letterSpacing: 1.5,
                textTransform: "uppercase",
              }}
            >
              Platform Administration
            </Text>
          </Space>

          <Divider style={{ margin: "24px 0 16px" }} />

          {/* Error */}
          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              closable
              onClose={() => setError(null)}
              style={{ marginBottom: 16, borderRadius: 8 }}
            />
          )}

          {/* Form */}
          <Form
            layout="vertical"
            onFinish={onFinish}
            autoComplete="off"
            size="large"
            requiredMark={false}
          >
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: "Please enter your email" },
                { type: "email", message: "Please enter a valid email" },
              ]}
            >
              <Input
                prefix={<MailOutlined style={{ color: "#9ca3af" }} />}
                placeholder="admin@fusion.app"
                variant="outlined"
                style={{ borderRadius: 8 }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: "Please enter your password" }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: "#9ca3af" }} />}
                placeholder="Enter your password"
                variant="outlined"
                style={{ borderRadius: 8 }}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={isPending}
                block
                size="large"
                icon={<RightOutlined />}
                iconPosition="end"
                style={{
                  height: 46,
                  borderRadius: 8,
                  background: `linear-gradient(135deg, ${wiitooBrand.primary}, #8B5CF6)`,
                  border: "none",
                  boxShadow: `0 4px 14px rgba(124,58,237,0.4)`,
                  fontWeight: 600,
                  fontSize: 15,
                }}
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>

          <div style={{ marginTop: 20, textAlign: "center" }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              © {new Date().getFullYear()} Wiitoo
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    background: "#0B0D15",
  },
  bg: {
    position: "absolute",
    inset: 0,
    background: `
      radial-gradient(ellipse at 20% 50%, rgba(124,58,237,0.25) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 50%, rgba(6,182,212,0.15) 0%, transparent 50%),
      radial-gradient(ellipse at 50% 100%, rgba(245,158,11,0.08) 0%, transparent 50%)
    `,
    backgroundSize: "200% 200%",
    animation: "gradientShift 15s ease infinite",
  },
  cardContainer: {
    position: "relative",
    zIndex: 1,
    width: "100%",
    maxWidth: 420,
    padding: "0 16px",
    animation: "slideUp 0.5s ease",
  },
  card: {
    borderRadius: 16,
    boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "#151724",
  },
};