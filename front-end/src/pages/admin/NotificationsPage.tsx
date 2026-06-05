import React, { useState, useEffect } from "react";
import { Form, Input, Button, Radio, Select, message, Typography, Card, Row, Col } from "antd";
import { SendOutlined, InfoCircleOutlined, NotificationOutlined } from "@ant-design/icons";
import api from "../../utils/api";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface StudentItem {
  id: number;
  full_name: string;
  email: string;
}

const AdminNotificationsPage: React.FC = () => {
  const [form] = Form.useForm();
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sendType, setSendType] = useState<"broadcast" | "individual">("broadcast");

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true);
      const res = await api.get("/students");
      setStudents(res.data);
    } catch (error) {
      console.error("Lỗi tải học viên:", error);
      message.error("Không thể tải danh sách học viên để chọn");
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    if (sendType === "individual") {
      fetchStudents();
    }
  }, [sendType]);

  const handleFormSubmit = async (values: any) => {
    try {
      setSubmitting(true);
      const payload = {
        title: values.title,
        message: values.message,
        broadcast: sendType === "broadcast",
        user_id: sendType === "individual" ? values.user_id : null,
      };

      const res = await api.post("/notifications", payload);
      message.success(res.data?.message || "Đã gửi thông báo thành công!");
      form.resetFields(["title", "message"]);
    } catch (error: any) {
      console.error("Lỗi gửi thông báo:", error);
      message.error(error.response?.data?.message || "Không thể gửi thông báo");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Card bordered={false} style={{ marginBottom: "16px", borderRadius: "8px" }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>
            Gửi Thông Báo Hệ Thống
          </Title>
          <Text type="secondary">Gửi tin nhắn thông báo, cập nhật tới toàn bộ học viên hoặc các cá nhân cụ thể</Text>
        </div>
      </Card>

      <Row gutter={16}>
        {/* Left Form Column */}
        <Col xs={24} lg={16}>
          <Card title="Soạn thông báo mới" bordered={false} style={{ borderRadius: "8px" }}>
            <Form form={form} layout="vertical" onFinish={handleFormSubmit} initialValues={{ type: "broadcast" }}>
              <Form.Item label="Đối tượng nhận thông báo" required>
                <Radio.Group
                  value={sendType}
                  onChange={(e) => setSendType(e.target.value)}
                  buttonStyle="solid"
                >
                  <Radio.Button value="broadcast">Tất cả học viên (Broadcast)</Radio.Button>
                  <Radio.Button value="individual">Gửi riêng cho một học viên</Radio.Button>
                </Radio.Group>
              </Form.Item>

              {sendType === "individual" && (
                <Form.Item
                  name="user_id"
                  label="Chọn học viên"
                  rules={[{ required: true, message: "Vui lòng chọn học viên!" }]}
                >
                  <Select
                    showSearch
                    placeholder="Tìm theo tên học viên hoặc email..."
                    optionFilterProp="children"
                    loading={loadingStudents}
                    filterOption={(input, option) =>
                      (option!.children as unknown as string).toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {students.map((s) => (
                      <Option key={s.id} value={s.id}>
                        {s.full_name} ({s.email})
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              )}

              <Form.Item
                name="title"
                label="Tiêu đề thông báo"
                rules={[{ required: true, message: "Vui lòng nhập tiêu đề!" }]}
              >
                <Input placeholder="Ví dụ: Lịch nghỉ lễ, Lịch học bù lớp IELTS..." />
              </Form.Item>

              <Form.Item
                name="message"
                label="Nội dung thông báo"
                rules={[{ required: true, message: "Vui lòng nhập nội dung!" }]}
              >
                <TextArea rows={6} placeholder="Nhập nội dung chi tiết của thông báo gửi tới học viên..." />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Button type="primary" htmlType="submit" loading={submitting} icon={<SendOutlined />}>
                  Gửi thông báo ngay
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* Right Info Column */}
        <Col xs={24} lg={8}>
          <Card title="Hướng dẫn & Lưu ý" bordered={false} style={{ borderRadius: "8px", height: "100%" }}>
            <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
              <NotificationOutlined style={{ fontSize: "24px", color: "#1890ff" }} />
              <div>
                <Text strong>Thông báo Real-time</Text>
                <Paragraph type="secondary" style={{ fontSize: "13px", marginTop: "4px" }}>
                  Học viên sẽ nhận được thông báo ngay lập tức trên thanh tiêu đề khi họ đang trực tuyến trên hệ thống.
                </Paragraph>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
              <InfoCircleOutlined style={{ fontSize: "24px", color: "#52c41a" }} />
              <div>
                <Text strong>Loại thông báo</Text>
                <Paragraph type="secondary" style={{ fontSize: "13px", marginTop: "4px" }}>
                  <strong>Broadcast:</strong> Gửi tin nhắn chung về hoạt động trung tâm, lịch nghỉ, sự kiện.
                  <br />
                  <strong>Gửi riêng:</strong> Nhắc nhở đóng học phí, sửa đổi lịch học riêng của cá nhân, hoặc kết quả thi.
                </Paragraph>
              </div>
            </div>

            <div style={{ background: "#f5f5f5", padding: "12px", borderRadius: "6px", marginTop: "24px" }}>
              <Text strong style={{ fontSize: "13px", color: "#262626" }}>Mẹo soạn thảo:</Text>
              <ul style={{ paddingLeft: "20px", margin: "8px 0 0 0", fontSize: "12px", color: "#595959" }}>
                <li>Viết tiêu đề ngắn gọn, rõ nghĩa.</li>
                <li>Nêu rõ thông tin ngày giờ, lớp học liên quan ở phần nội dung.</li>
                <li>Học viên sẽ thấy số lượng thông báo chưa đọc tăng lên tại icon quả chuông.</li>
              </ul>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminNotificationsPage;
