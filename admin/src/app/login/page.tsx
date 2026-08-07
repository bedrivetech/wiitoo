"use client";

import { useState } from "react";
import { useLogin } from "@refinedev/core";
import { Card, Form, Input, Button, Typography, Alert, Space } from "antd";
import { LockOutlined, MailOutlined } from "@ant-design/icons";

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
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f0f2f5",
      }}
    >
      <Card style={{ width: 400, boxShadow: "0 2px 8px rgba(0,0,0,0.09)" }}>
        <Space
          direction="vertical"
          size="large"
          style={{ width: "100%", textAlign: "center" }}
        >
          <div>
            <Title level={3} style={{ marginBottom: 4 }}>
              Fusion Platform
            </Title>
            <Text type="secondary">Admin Panel</Text>
          </div>

          {error && (
            <Alert message={error} type="error" showIcon closable onClose={() => setError(null)} />
          )}

          <Form
            layout="vertical"
            onFinish={onFinish}
            autoComplete="off"
            size="large"
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: "Please enter your email" },
                { type: "email", message: "Please enter a valid email" },
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="Email"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: "Please enter your password" }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Password"
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={isPending}
                block
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>
        </Space>
      </Card>
    </div>
  );
}