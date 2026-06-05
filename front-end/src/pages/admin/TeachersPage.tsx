import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Input,
  Modal,
  Form,
  Space,
  Popconfirm,
  message,
  Typography,
  Card,
} from "antd";
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import api from "../../utils/api";

const { Title, Text } = Typography;

interface TeacherItem {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  specialization: string;
}

const AdminTeachersPage: React.FC = () => {
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherItem | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/teachers");
      setTeachers(res.data);
    } catch (error) {
      console.error("Lỗi tải danh sách giáo viên:", error);
      message.error("Không thể tải danh sách giáo viên");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleOpenCreate = () => {
    setEditingTeacher(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (teacher: TeacherItem) => {
    setEditingTeacher(teacher);
    form.setFieldsValue({
      full_name: teacher.full_name,
      email: teacher.email,
      phone: teacher.phone,
      specialization: teacher.specialization,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/teachers/${id}`);
      message.success("Xóa giảng viên thành công");
      fetchTeachers();
    } catch (error: any) {
      console.error("Lỗi xóa giáo viên:", error);
      message.error(error.response?.data?.message || "Không thể xóa giảng viên này (có thể do lớp học đang liên kết)");
    }
  };

  const handleFormSubmit = async (values: any) => {
    try {
      setSubmitting(true);
      if (editingTeacher) {
        
        await api.put(`/teachers/${editingTeacher.id}`, values);
        message.success("Cập nhật thông tin giảng viên thành công");
      } else {
        
        await api.post("/teachers", values);
        message.success("Thêm giảng viên mới thành công");
      }
      setIsModalOpen(false);
      fetchTeachers();
    } catch (error: any) {
      console.error("Lỗi lưu giảng viên:", error);
      message.error(error.response?.data?.message || "Có lỗi xảy ra khi lưu giảng viên");
    } finally {
      setSubmitting(false);
    }
  };

  
  const filteredTeachers = teachers.filter((teacher) => {
    const term = searchText.toLowerCase();
    return (
      teacher.full_name.toLowerCase().includes(term) ||
      teacher.email.toLowerCase().includes(term) ||
      teacher.phone?.toLowerCase().includes(term) ||
      teacher.specialization?.toLowerCase().includes(term)
    );
  });

  const columns = [
    {
      title: "Họ và Tên",
      dataIndex: "full_name",
      key: "full_name",
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Số Điện Thoại",
      dataIndex: "phone",
      key: "phone",
      render: (phone: string) => phone || "N/A",
    },
    {
      title: "Chuyên Môn / Bằng Cấp",
      dataIndex: "specialization",
      key: "specialization",
      render: (spec: string) => spec || "N/A",
    },
    {
      title: "Thao Tác",
      key: "actions",
      width: 150,
      render: (_: any, record: TeacherItem) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EditOutlined style={{ color: "#1890ff" }} />}
            onClick={() => handleOpenEdit(record)}
            title="Chỉnh sửa"
          />
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa giảng viên này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              title="Xóa giáo viên"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card bordered={false} style={{ marginBottom: "16px", borderRadius: "8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              Quản lý Giáo viên
            </Title>
            <Text type="secondary">Danh sách giảng viên tham gia giảng dạy tại Tata English Center</Text>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
            Thêm Giáo viên
          </Button>
        </div>
      </Card>

      {}
      <Card bordered={false} style={{ marginBottom: "16px", borderRadius: "8px" }}>
        <Input
          placeholder="Tìm giảng viên theo tên, email, SĐT, chuyên môn..."
          prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: "350px" }}
          allowClear
        />
      </Card>

      {}
      <Card bordered={false} style={{ borderRadius: "8px" }}>
        <Table
          dataSource={filteredTeachers}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 8 }}
          locale={{ emptyText: "Không tìm thấy giảng viên nào" }}
        />
      </Card>

      {}
      <Modal
        title={editingTeacher ? "Chỉnh sửa Giảng viên" : "Thêm Giảng viên Mới"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
          <Form.Item
            name="full_name"
            label="Họ và tên giảng viên"
            rules={[{ required: true, message: "Vui lòng nhập họ tên!" }]}
          >
            <Input placeholder="Ví dụ: Nguyễn Văn A" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email liên hệ"
            rules={[
              { required: true, message: "Vui lòng nhập email!" },
              { type: "email", message: "Email không đúng định dạng!" },
            ]}
          >
            <Input placeholder="Ví dụ: teacher@example.com" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[{ required: true, message: "Vui lòng nhập số điện thoại!" }]}
          >
            <Input placeholder="Ví dụ: 0912345678" />
          </Form.Item>

          <Form.Item
            name="specialization"
            label="Chuyên môn / Bằng cấp"
            rules={[{ required: true, message: "Vui lòng nhập chuyên môn!" }]}
          >
            <Input placeholder="Ví dụ: IELTS 8.5, TESOL" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                Lưu lại
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminTeachersPage;
