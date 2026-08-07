"use client";

import { useState, useEffect } from "react";
import { useTable } from "@refinedev/core";
import {
  Card,
  Typography,
  Table,
  Button,
  Space,
  Tag,
  Select,
  message,
  Row,
  Col,
  Modal,
  Form,
  Input,
  Popconfirm,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SwapOutlined,
  SaveOutlined,
} from "@ant-design/icons";

const { Title } = Typography;

const strategyColors: Record<string, string> = {
  round_robin: "blue",
  geo: "green",
  capacity: "orange",
};

export default function RoutingRulesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [form] = Form.useForm();
  const [buckets, setBuckets] = useState<any[]>([]);

  const { tableQuery, currentPage, setCurrentPage, pageSize, setPageSize } = useTable({
    resource: "storage/routing",
    pagination: { currentPage: 1, pageSize: 20 },
  });

  const data = tableQuery?.data?.data || [];
  const total = tableQuery?.data?.total || 0;
  const isLoading = tableQuery?.isLoading || false;

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    fetch(`${API_BASE}/api/v1/admin/storage/buckets`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-User-Role": "admin",
      },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setBuckets(json.data || []);
      })
      .catch(() => {});
  }, []);

  const getApiBase = () =>
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  const getHeaders = () => {
    const token = localStorage.getItem("access_token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-User-Role": "admin",
    };
  };

  const handleCreate = async (values: any) => {
    const res = await fetch(`${getApiBase()}/api/v1/admin/storage/routing`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(values),
    });
    const json = await res.json();
    if (json.success) {
      message.success("Routing rule created");
      setModalOpen(false);
      form.resetFields();
      tableQuery?.refetch?.();
    } else {
      message.error(json.error?.message || "Failed to create rule");
    }
  };

  const handleUpdate = async (values: any) => {
    const res = await fetch(
      `${getApiBase()}/api/v1/admin/storage/routing/${editingRule.usage}`,
      {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(values),
      }
    );
    const json = await res.json();
    if (json.success) {
      message.success("Routing rule updated");
      setModalOpen(false);
      setEditingRule(null);
      form.resetFields();
      tableQuery?.refetch?.();
    } else {
      message.error(json.error?.message || "Failed to update rule");
    }
  };

  const handleDelete = async (usage: string) => {
    const res = await fetch(
      `${getApiBase()}/api/v1/admin/storage/routing/${usage}`,
      {
        method: "DELETE",
        headers: getHeaders(),
      }
    );
    const json = await res.json();
    if (json.success) {
      message.success("Routing rule deleted");
      tableQuery?.refetch?.();
    } else {
      message.error(json.error?.message || "Failed to delete rule");
    }
  };

  const openEditModal = (rule: any) => {
    setEditingRule(rule);
    form.setFieldsValue({
      usage: rule.usage,
      strategy: rule.strategy,
    });
    setModalOpen(true);
  };

  const columns = [
    {
      title: "Usage",
      dataIndex: "usage",
      key: "usage",
      render: (usage: string) => <Tag>{usage}</Tag>,
    },
    {
      title: "Strategy",
      dataIndex: "strategy",
      key: "strategy",
      render: (strategy: string) => (
        <Tag color={strategyColors[strategy] || "default"}>
          <SwapOutlined /> {strategy}
        </Tag>
      ),
    },
    {
      title: "Bucket IDs",
      dataIndex: "bucketIds",
      key: "bucketIds",
      render: (ids: string[]) => (
        <Space size={4} wrap>
          {ids?.length > 0
            ? ids.map((id) => <Tag key={id} style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis" }}>{id.substring(0, 8)}...</Tag>)
            : <Tag>No buckets</Tag>}
        </Space>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (_: any, record: any) => (
        <Tag color={record.isActive !== false ? "green" : "red"}>
          {record.isActive !== false ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 180,
      render: (_: any, record: any) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete this routing rule?"
            onConfirm={() => handleDelete(record.usage)}
          >
            <Button danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
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
              <SwapOutlined /> Upload Routing Rules
            </Title>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingRule(null);
                form.resetFields();
                setModalOpen(true);
              }}
            >
              Add Rule
            </Button>
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
            showTotal: (total: number) => `Total ${total} rules`,
          }}
          loading={isLoading}
          scroll={{ x: 800 }}
        />
      </Space>

      <Modal
        title={editingRule ? `Edit Rule: ${editingRule.usage}` : "Add Routing Rule"}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setEditingRule(null);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={editingRule ? handleUpdate : handleCreate}
          initialValues={{ usage: "general", strategy: "round_robin" }}
        >
          {!editingRule && (
            <Form.Item
              label="Usage Type"
              name="usage"
              rules={[{ required: true, message: "Usage type is required" }]}
            >
              <Select
                options={[
                  { label: "Video", value: "video" },
                  { label: "Thumbnail", value: "thumbnail" },
                  { label: "Backup", value: "backup" },
                  { label: "General", value: "general" },
                ]}
              />
            </Form.Item>
          )}

          <Form.Item
            label="Strategy"
            name="strategy"
            rules={[{ required: true }]}
          >
            <Select
              options={[
                { label: "Round Robin", value: "round_robin" },
                { label: "Geo (region-based)", value: "geo" },
                { label: "Capacity (most free space)", value: "capacity" },
              ]}
            />
          </Form.Item>

          <Form.Item label="Bucket IDs (comma-separated)" name="bucketIds">
            <Select
              mode="multiple"
              placeholder="Select buckets"
              options={buckets.map((b: any) => ({
                label: `${b.displayName} (${b.name})`,
                value: b.id,
              }))}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
              {editingRule ? "Update Rule" : "Create Rule"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}