"use client";

import { useTable, useCustomMutation, useApiUrl } from "@refinedev/core";
import {
  Table,
  Button,
  Space,
  Tag,
  Card,
  Typography,
  Row,
  Col,
  Modal,
  Input,
  message,
  Select,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  IdcardOutlined,
} from "@ant-design/icons";
import { useState, useCallback } from "react";

const { Title, Text } = Typography;

const statusColors: Record<string, string> = {
  pending: "gold",
  approved: "green",
  rejected: "red",
};

export default function CreatorVerificationList() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [actionModal, setActionModal] = useState<{
    open: boolean;
    action: "approve" | "reject";
    requestId: string;
  }>({ open: false, action: "approve", requestId: "" });
  const [rejectReason, setRejectReason] = useState("");
  const apiUrl = useApiUrl();

  const { mutate: customMutate, mutation: customMutation } = useCustomMutation();
  const isMutating = customMutation?.isPending || false;

  const permanentFilters: any[] = [];
  if (statusFilter) {
    permanentFilters.push({ field: "status", operator: "eq" as const, value: statusFilter });
  }

  const { tableQuery, currentPage, setCurrentPage, pageSize, setPageSize } =
    useTable({
      resource: "creator-verification",
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

  const handleAction = useCallback(() => {
    const { action, requestId } = actionModal;

    if (action === "approve") {
      customMutate(
        {
          url: `${apiUrl}/creator-verification/${requestId}/approve`,
          method: "post",
          values: {},
        },
        {
          onSuccess: () => {
            message.success("Creator verification approved");
            setActionModal({ open: false, action: "approve", requestId: "" });
            tableQuery?.refetch?.();
          },
          onError: (error: any) => {
            message.error(error?.message || "Failed to approve");
          },
        }
      );
    } else if (action === "reject") {
      customMutate(
        {
          url: `${apiUrl}/creator-verification/${requestId}/reject`,
          method: "post",
          values: { reason: rejectReason },
        },
        {
          onSuccess: () => {
            message.success("Creator verification rejected");
            setActionModal({ open: false, action: "approve", requestId: "" });
            setRejectReason("");
            tableQuery?.refetch?.();
          },
          onError: (error: any) => {
            message.error(error?.message || "Failed to reject");
          },
        }
      );
    }
  }, [actionModal, rejectReason, customMutate, apiUrl, tableQuery]);

  const columns = [
    {
      title: "Email",
      dataIndex: "userEmail",
      key: "userEmail",
    },
    {
      title: "Username",
      dataIndex: "userUsername",
      key: "userUsername",
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
      title: "Submitted",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (val: string) =>
        val ? new Date(val).toLocaleString() : "-",
    },
    {
      title: "Reviewed By",
      dataIndex: "reviewedBy",
      key: "reviewedBy",
      render: (val: string) => val?.substring(0, 8) || "-",
    },
    {
      title: "Reviewed At",
      dataIndex: "reviewedAt",
      key: "reviewedAt",
      render: (val: string) =>
        val ? new Date(val).toLocaleString() : "-",
    },
    {
      title: "Notes",
      dataIndex: "notes",
      key: "notes",
      render: (val: string) => val || "-",
      ellipsis: true,
    },
    {
      title: "Actions",
      key: "actions",
      width: 200,
      render: (_: any, record: any) => (
        <Space>
          {record.status === "pending" && (
            <>
              <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() =>
                  setActionModal({
                    open: true,
                    action: "approve",
                    requestId: record.id,
                  })
                }
              >
                Approve
              </Button>
              <Button
                danger
                size="small"
                icon={<CloseCircleOutlined />}
                onClick={() =>
                  setActionModal({
                    open: true,
                    action: "reject",
                    requestId: record.id,
                  })
                }
              >
                Reject
              </Button>
            </>
          )}
          {record.status !== "pending" && (
            <Text type="secondary">
              {record.status === "approved" ? "Approved" : "Rejected"}
            </Text>
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
              <IdcardOutlined /> Creator Verification Requests
            </Title>
          </Col>
          <Col>
            <Select
              placeholder="Filter by Status"
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
              style={{ width: 160 }}
              options={[
                { label: "Pending", value: "pending" },
                { label: "Approved", value: "approved" },
                { label: "Rejected", value: "rejected" },
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
            pageSize: pageSize,
            total: total,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            },
            showSizeChanger: true,
            showTotal: (total: number) => `Total ${total} requests`,
          }}
          loading={isLoading}
          scroll={{ x: 1000 }}
        />

        <Modal
          title={
            actionModal.action === "approve"
              ? "Approve Creator Verification"
              : "Reject Creator Verification"
          }
          open={actionModal.open}
          onOk={handleAction}
          onCancel={() => {
            setActionModal({ open: false, action: "approve", requestId: "" });
            setRejectReason("");
          }}
          confirmLoading={isMutating}
          okText={actionModal.action === "approve" ? "Approve" : "Reject"}
          okButtonProps={
            actionModal.action === "reject" ? { danger: true } : undefined
          }
        >
          <Space direction="vertical" style={{ width: "100%" }}>
            {actionModal.action === "approve" ? (
              <p>
                Are you sure you want to approve this creator verification request?
                The user will be granted the &ldquo;creator&rdquo; role.
              </p>
            ) : (
              <>
                <p>Reason for rejection:</p>
                <Input.TextArea
                  placeholder="Enter reason..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                />
              </>
            )}
          </Space>
        </Modal>
      </Space>
    </Card>
  );
}