"use client";

import { useOne, useCustomMutation, useApiUrl } from "@refinedev/core";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Typography,
  Spin,
  message,
  Divider,
  Input,
  Image,
  List,
} from "antd";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  IdcardOutlined,
  FileTextOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { useState } from "react";

const { Title, Text } = Typography;

const statusColors: Record<string, string> = {
  pending: "gold",
  approved: "green",
  rejected: "red",
};

export default function CreatorVerificationShow() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const apiUrl = useApiUrl();
  const [rejectReason, setRejectReason] = useState("");

  const { query, result: request } = useOne({
    resource: "creator-verification",
    id,
  });

  const { mutate: customMutate, mutation: customMutation } = useCustomMutation();

  const handleApprove = () => {
    customMutate(
      {
        url: `${apiUrl}/creator-verification/${id}/approve`,
        method: "post",
        values: {},
      },
      {
        onSuccess: () => {
          message.success("Creator verification approved");
          query.refetch?.();
        },
        onError: (error: any) => {
          message.error(error?.message || "Failed to approve");
        },
      }
    );
  };

  const handleReject = () => {
    customMutate(
      {
        url: `${apiUrl}/creator-verification/${id}/reject`,
        method: "post",
        values: { reason: rejectReason },
      },
      {
        onSuccess: () => {
          message.success("Creator verification rejected");
          setRejectReason("");
          query.refetch?.();
        },
        onError: (error: any) => {
          message.error(error?.message || "Failed to reject");
        },
      }
    );
  };

  const isLoading = query.isLoading;
  const req = request as any;

  if (isLoading) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (!req) {
    return (
      <Card>
        <Title level={4}>Verification request not found</Title>
        <Button onClick={() => router.push("/resources/creator-verification")}>
          Back to Requests
        </Button>
      </Card>
    );
  }

  const documents = req.documents || req.documentUrls || [];

  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push("/resources/creator-verification")}
          >
            Back
          </Button>
          <Title level={4} style={{ margin: 0 }}>
            <IdcardOutlined /> Creator Verification Request
          </Title>
          <Tag color={statusColors[req.status]}>{req.status}</Tag>
        </Space>

        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="Request ID" span={2}>
            {req.id}
          </Descriptions.Item>
          <Descriptions.Item label="Email">{req.userEmail || req.email || "-"}</Descriptions.Item>
          <Descriptions.Item label="Username">
            {req.userUsername || req.username || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="User ID" span={2}>
            {req.userId || req.user_id || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={statusColors[req.status]}>{req.status}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Submitted At">
            {req.createdAt || req.created_at
              ? new Date(req.createdAt || req.created_at).toLocaleString()
              : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Reviewed By">
            {req.reviewedBy || req.reviewed_by || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Reviewed At">
            {req.reviewedAt || req.reviewed_at
              ? new Date(req.reviewedAt || req.reviewed_at).toLocaleString()
              : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Notes" span={2}>
            {req.notes || req.reviewNotes || "-"}
          </Descriptions.Item>
        </Descriptions>

        {/* Submitted Documents */}
        <Card size="small" title={
          <span><FileTextOutlined /> Submitted Documents ({documents.length})</span>
        }>
          {documents.length > 0 ? (
            <List
              dataSource={documents}
              renderItem={(doc: any, index: number) => {
                const docUrl = typeof doc === "string" ? doc : doc.url;
                const docName = typeof doc === "string" ? `Document ${index + 1}` : (doc.name || `Document ${index + 1}`);
                return (
                  <List.Item
                    actions={docUrl ? [
                      <Button
                        key="download"
                        type="link"
                        icon={<DownloadOutlined />}
                        href={docUrl}
                        target="_blank"
                      >
                        View / Download
                      </Button>,
                    ] : []}
                  >
                    <List.Item.Meta
                      title={docName}
                      description={doc.type || "Identity document"}
                    />
                  </List.Item>
                );
              }}
            />
          ) : (
            <Text type="secondary">No documents submitted with this request.</Text>
          )}
        </Card>

        {/* User Info from request */}
        {(req.userDisplayName || req.userBio || req.userAvatarUrl) && (
          <Card size="small" title="User Profile Information">
            <Descriptions column={1} size="small">
              {req.userDisplayName && (
                <Descriptions.Item label="Display Name">
                  {req.userDisplayName}
                </Descriptions.Item>
              )}
              {req.userBio && (
                <Descriptions.Item label="Bio">
                  {req.userBio}
                </Descriptions.Item>
              )}
              {req.userAvatarUrl && (
                <Descriptions.Item label="Avatar">
                  <Image
                    src={req.userAvatarUrl}
                    alt="User avatar"
                    width={80}
                    style={{ borderRadius: 8 }}
                  />
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        )}

        {/* Action buttons for pending requests */}
        {req.status === "pending" && (
          <>
            <Divider />
            <div>
              <Text strong style={{ fontSize: 16 }}>
                Moderation Actions
              </Text>
            </div>

            <Space direction="vertical" style={{ width: "100%", maxWidth: 600 }}>
              {rejectReason && (
                <div>
                  <Text>Reason for rejection:</Text>
                  <Input.TextArea
                    rows={3}
                    placeholder="Enter reason for rejection..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    style={{ marginTop: 4 }}
                  />
                </div>
              )}
              <Space wrap>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={handleApprove}
                  loading={customMutation.isPending}
                >
                  Approve Verification
                </Button>
                <Button
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={() => {
                    if (!rejectReason) {
                      setRejectReason(" ");
                    }
                    if (rejectReason || true) {
                      handleReject();
                    }
                  }}
                  loading={customMutation.isPending}
                >
                  Reject Verification
                </Button>
              </Space>

              {!rejectReason && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Enter a reason above before rejecting.
                </Text>
              )}
            </Space>
          </>
        )}
      </Space>
    </Card>
  );
}