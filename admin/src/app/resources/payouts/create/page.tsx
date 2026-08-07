"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  Form,
  Input,
  InputNumber,
  Button,
  Space,
  Typography,
  message,
} from "antd";
import { ArrowLeftOutlined, SendOutlined } from "@ant-design/icons";

const { Title } = Typography;

export default function PayoutsCreate() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleFinish = async (values: any) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const response = await fetch(`${API_BASE}/api/v1/admin/payouts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });
      const json = await response.json();
      if (json.success) {
        message.success("Payout triggered successfully");
        router.push("/resources/payouts");
      } else {
        message.error(json.error?.message || "Failed to trigger payout");
      }
    } catch (err: any) {
      message.error(err.message || "Failed to trigger payout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push("/resources/payouts")}
          >
            Back
          </Button>
          <Title level={4} style={{ margin: 0 }}>
            Trigger Payout
          </Title>
        </Space>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          style={{ maxWidth: 500 }}
        >
          <Form.Item
            label="Creator ID"
            name="creatorId"
            rules={[{ required: true, message: "Please enter a creator ID" }]}
          >
            <Input placeholder="Creator ID" />
          </Form.Item>

          <Form.Item
            label="Amount ($)"
            name="amount"
            rules={[
              { required: true, message: "Please enter an amount" },
              {
                type: "number",
                min: 0.01,
                message: "Amount must be at least $0.01",
              },
            ]}
          >
            <InputNumber
              style={{ width: "100%" }}
              placeholder="0.00"
              min={0.01}
              step={0.01}
              precision={2}
              prefix="$"
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SendOutlined />}
                loading={loading}
              >
                Trigger Payout
              </Button>
              <Button onClick={() => router.push("/resources/payouts")}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Space>
    </Card>
  );
}