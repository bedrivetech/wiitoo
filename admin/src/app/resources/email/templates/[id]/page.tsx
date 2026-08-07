"use client";

import { useNavigation, useOne } from "@refinedev/core";
import {
  Card,
  Typography,
  Descriptions,
  Space,
  Button,
  Row,
  Col,
  Spin,
  Tag,
  Divider,
  Input,
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { useParams } from "next/navigation";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function TemplateDetailPage() {
  const params = useParams();
  const { edit, list } = useNavigation();
  const id = params.id as string;

  const { query, result } = useOne({
    resource: "email/templates",
    id,
  });

  const tmpl = result;

  if (query.isLoading) {
    return <Spin size="large" style={{ display: "block", margin: "100px auto" }} />;
  }

  if (!tmpl) {
    return (
      <Card>
        <Text type="danger">Template not found</Text>
      </Card>
    );
  }

  return (
    <Card>
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => list("email/templates")}
              />
              <Title level={4} style={{ margin: 0 }}>
                <FileTextOutlined /> {tmpl.name}
              </Title>
            </Space>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => edit("email/templates", id)}
            >
              Edit
            </Button>
          </Col>
        </Row>

        <Descriptions bordered column={1}>
          <Descriptions.Item label="Name">{tmpl.name}</Descriptions.Item>
          <Descriptions.Item label="Description">
            {tmpl.description || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Type">
            {tmpl.isSystem ? (
              <Tag color="blue">System</Tag>
            ) : (
              <Tag>Custom</Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Variables">
            {tmpl.variables?.length > 0
              ? tmpl.variables.map((v: string) => (
                  <Tag key={v}>{`{{${v}}}`}</Tag>
                ))
              : "None"}
          </Descriptions.Item>
          <Descriptions.Item label="Created At">
            {new Date(tmpl.createdAt).toLocaleString()}
          </Descriptions.Item>
        </Descriptions>

        <Divider />
        <Title level={5}>Subject</Title>
        <Paragraph code>{tmpl.subject}</Paragraph>

        <Divider />
        <Title level={5}>Text Body</Title>
        <TextArea
          rows={6}
          value={tmpl.textBody}
          readOnly
          style={{ fontFamily: "monospace" }}
        />

        <Divider />
        <Title level={5}>HTML Body</Title>
        <TextArea
          rows={8}
          value={tmpl.htmlBody}
          readOnly
          style={{ fontFamily: "monospace" }}
        />

        <Divider />
        <div
          style={{
            border: "1px solid #d9d9d9",
            borderRadius: 8,
            padding: 24,
            background: "#fff",
          }}
        >
          <Title level={5}>Preview</Title>
          <div dangerouslySetInnerHTML={{ __html: tmpl.htmlBody }} />
        </div>
      </Space>
    </Card>
  );
}