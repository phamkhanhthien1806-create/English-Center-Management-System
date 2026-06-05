import React, { useState, useEffect } from "react";
import { Table, Button, Tag, Space, Select, Modal, Form, message, Typography, Card } from "antd";
import { CheckCircleOutlined, CreditCardOutlined } from "@ant-design/icons";
import api from "../../utils/api";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;

interface PaymentItem {
  id: number;
  enrollment_id: number;
  amount: number;
  payment_status: string;
  payment_date: string | null;
  payment_method_id: number;
  method_name: string;
  student_name: string;
  student_email: string;
  class_name: string;
  course_name: string;
}

interface PaymentMethod {
  id: number;
  method_name: string;
}

const AdminPaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Confirm Payment Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentItem | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter) params.payment_status = statusFilter;
      const res = await api.get("/payments", { params });
      setPayments(res.data);
    } catch (error) {
      console.error("Lỗi tải danh sách thanh toán:", error);
      message.error("Không thể tải danh sách hóa đơn học phí");
    } finally {
      setLoading(false);
    }
  };

  const fetchMethods = async () => {
    try {
      const res = await api.get("/payments/methods");
      setMethods(res.data);
    } catch (error) {
      console.error("Lỗi tải danh mục thanh toán:", error);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchMethods();
  }, [statusFilter]);

  const handleOpenConfirmModal = (payment: PaymentItem) => {
    setSelectedPayment(payment);
    form.setFieldsValue({
      payment_method_id: payment.payment_method_id || (methods.length > 0 ? methods[0].id : undefined),
    });
    setIsModalOpen(true);
  };

  const handleConfirmPayment = async (values: any) => {
    if (!selectedPayment) return;
    try {
      setSubmitting(true);
      await api.put(`/payments/${selectedPayment.id}/status`, {
        payment_status: "đã thanh toán",
        payment_method_id: values.payment_method_id,
      });
      message.success(`Đã xác nhận thanh toán thành công cho học viên ${selectedPayment.student_name}`);
      setIsModalOpen(false);
      fetchPayments();
    } catch (error: any) {
      console.error("Lỗi xác nhận thanh toán:", error);
      message.error(error.response?.data?.message || "Không thể cập nhật trạng thái thanh toán");
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: "Học Viên",
      dataIndex: "student_name",
      key: "student_name",
      render: (name: string, record: PaymentItem) => (
        <div>
          <Text strong>{name}</Text>
          <div style={{ fontSize: "11px", color: "#8c8c8c" }}>{record.student_email}</div>
        </div>
      ),
    },
    {
      title: "Lớp / Khóa học",
      dataIndex: "class_name",
      key: "class_name",
      render: (className: string, record: PaymentItem) => (
        <div>
          <Text>{className}</Text>
          <div style={{ fontSize: "11px", color: "#1890ff" }}>{record.course_name}</div>
        </div>
      ),
    },
    {
      title: "Số Tiền",
      dataIndex: "amount",
      key: "amount",
      render: (amount: number) => (
        <span style={{ fontWeight: 600, color: "#fa8c16" }}>
          {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount)}
        </span>
      ),
      sorter: (a: PaymentItem, b: PaymentItem) => a.amount - b.amount,
    },
    {
      title: "Phương Thức",
      dataIndex: "method_name",
      key: "method_name",
      render: (name: string) => <Tag color="blue">{name || "Chưa chọn"}</Tag>,
    },
    {
      title: "Ngày Thanh Toán",
      dataIndex: "payment_date",
      key: "payment_date",
      render: (date: string | null) => (date ? dayjs(date).format("DD/MM/YYYY HH:mm") : <Text type="secondary">-</Text>),
    },
    {
      title: "Trạng Thái",
      dataIndex: "payment_status",
      key: "payment_status",
      render: (status: string) => {
        let color = "orange";
        if (status === "đã thanh toán") color = "green";
        else if (status === "thất bại") color = "red";
        return (
          <Tag color={color} style={{ fontWeight: "bold" }}>
            {status.toUpperCase()}
          </Tag>
        );
      },
      filters: [
        { text: "Chờ thanh toán", value: "chờ thanh toán" },
        { text: "Đã thanh toán", value: "đã thanh toán" },
        { text: "Thất bại", value: "thất bại" },
      ],
      onFilter: (value: any, record: PaymentItem) => record.payment_status === value,
    },
    {
      title: "Thao Tác",
      key: "actions",
      width: 180,
      render: (_: any, record: PaymentItem) => {
        if (record.payment_status === "đã thanh toán") {
          return (
            <Space style={{ color: "#52c41a" }}>
              <CheckCircleOutlined />
              <span>Đã hoàn thành</span>
            </Space>
          );
        }
        return (
          <Button
            type="primary"
            size="small"
            icon={<CreditCardOutlined />}
            onClick={() => handleOpenConfirmModal(record)}
            style={{ background: "#52c41a", borderColor: "#52c41a" }}
          >
            Xác nhận đóng học phí
          </Button>
        );
      },
    },
  ];

  return (
    <div>
      <Card bordered={false} style={{ marginBottom: "16px", borderRadius: "8px" }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>
            Quản lý Học phí
          </Title>
          <Text type="secondary">Theo dõi các giao dịch học phí, hóa đơn của học viên đăng ký khóa học</Text>
        </div>
      </Card>

      {/* Filter Card */}
      <Card bordered={false} style={{ marginBottom: "16px", borderRadius: "8px" }}>
        <Space size="large">
          <Text>Lọc theo trạng thái thanh toán:</Text>
          <Select
            placeholder="Tất cả trạng thái"
            style={{ width: "200px" }}
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            allowClear
          >
            <Option value="chờ thanh toán">Chờ thanh toán</Option>
            <Option value="đã thanh toán">Đã thanh toán</Option>
            <Option value="thất bại">Thất bại</Option>
          </Select>
        </Space>
      </Card>

      {/* Table Card */}
      <Card bordered={false} style={{ borderRadius: "8px" }}>
        <Table
          dataSource={payments}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 8 }}
          locale={{ emptyText: "Không tìm thấy hóa đơn học phí nào" }}
        />
      </Card>

      {/* Confirm Payment Modal */}
      <Modal
        title="Xác nhận thanh toán học phí"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        {selectedPayment && (
          <Form form={form} layout="vertical" onFinish={handleConfirmPayment}>
            <div style={{ marginBottom: "16px", borderBottom: "1px solid #f0f0f0", paddingBottom: "12px" }}>
              <p><strong>Học viên:</strong> {selectedPayment.student_name}</p>
              <p><strong>Lớp học:</strong> {selectedPayment.class_name}</p>
              <p><strong>Khóa học:</strong> {selectedPayment.course_name}</p>
              <p><strong>Học phí cần thu:</strong> <span style={{ color: "#fa8c16", fontWeight: "bold" }}>
                {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(selectedPayment.amount)}
              </span></p>
            </div>

            <Form.Item
              name="payment_method_id"
              label="Chọn phương thức thanh toán"
              rules={[{ required: true, message: "Vui lòng chọn phương thức thanh toán!" }]}
            >
              <Select placeholder="Chọn phương thức">
                {methods.map((m) => (
                  <Option key={m.id} value={m.id}>
                    {m.method_name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
              <Space>
                <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
                <Button type="primary" htmlType="submit" loading={submitting} style={{ background: "#52c41a", borderColor: "#52c41a" }}>
                  Xác nhận đã thu tiền
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default AdminPaymentsPage;
