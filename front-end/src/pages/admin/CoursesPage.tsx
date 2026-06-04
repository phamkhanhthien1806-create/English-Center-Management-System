import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Input,
  Select,
  Modal,
  Form,
  InputNumber,
  Space,
  Popconfirm,
  message,
  Typography,
  Card,
  Tag,
} from "antd";
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import api from "../../utils/api";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface CourseCategory {
  id: number;
  category_name: string;
}

interface Course {
  id: number;
  category_id: number;
  category_name: string;
  course_name: string;
  level: string;
  tuition_fee: number;
  duration: string;
  description: string;
}

const AdminCoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [loading, setLoading] = useState(false);

  // Search and Filter State
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [coursesRes, categoriesRes] = await Promise.all([
        api.get("/courses"),
        api.get("/courses/categories"),
      ]);
      setCourses(coursesRes.data);
      setCategories(categoriesRes.data);
    } catch (error: any) {
      console.error("Lỗi lấy dữ liệu khóa học:", error);
      message.error("Không thể tải danh sách khóa học");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingCourse(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (course: Course) => {
    setEditingCourse(course);
    form.setFieldsValue({
      category_id: course.category_id,
      course_name: course.course_name,
      level: course.level,
      tuition_fee: course.tuition_fee,
      duration: course.duration,
      description: course.description,
    });
    setIsModalOpen(true);
  };

  const handleDeleteCourse = async (id: number) => {
    try {
      await api.delete(`/courses/${id}`);
      message.success("Xóa khóa học thành công");
      fetchData();
    } catch (error: any) {
      console.error("Lỗi xóa khóa học:", error);
      message.error(error.response?.data?.message || "Không thể xóa khóa học này (có thể đã có lớp học liên kết)");
    }
  };

  const handleFormSubmit = async (values: any) => {
    try {
      setSubmitting(true);
      if (editingCourse) {
        // Edit mode
        await api.put(`/courses/${editingCourse.id}`, values);
        message.success("Cập nhật khóa học thành công");
      } else {
        // Create mode
        await api.post("/courses", values);
        message.success("Thêm khóa học mới thành công");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      console.error("Lỗi lưu khóa học:", error);
      message.error(error.response?.data?.message || "Có lỗi xảy ra khi lưu khóa học");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter courses based on search text & selected category
  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.course_name.toLowerCase().includes(searchText.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchText.toLowerCase()) ||
      course.level.toLowerCase().includes(searchText.toLowerCase());

    const matchesCategory = selectedCategory ? course.category_id === selectedCategory : true;

    return matchesSearch && matchesCategory;
  });

  const columns = [
    {
      title: "Tên Khóa Học",
      dataIndex: "course_name",
      key: "course_name",
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: "Danh Mục",
      dataIndex: "category_name",
      key: "category_name",
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: "Trình Độ",
      dataIndex: "level",
      key: "level",
      render: (text: string) => <Tag color="purple">{text}</Tag>,
    },
    {
      title: "Học Phí",
      dataIndex: "tuition_fee",
      key: "tuition_fee",
      render: (fee: number) => (
        <span style={{ fontWeight: 600, color: "#fa8c16" }}>
          {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(fee)}
        </span>
      ),
      sorter: (a: Course, b: Course) => a.tuition_fee - b.tuition_fee,
    },
    {
      title: "Thời Lượng",
      dataIndex: "duration",
      key: "duration",
    },
    {
      title: "Mô Tả",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      width: 250,
    },
    {
      title: "Thao Tác",
      key: "actions",
      width: 150,
      render: (_: any, record: Course) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EditOutlined style={{ color: "#1890ff" }} />}
            onClick={() => handleOpenEditModal(record)}
            title="Chỉnh sửa"
          />
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa khóa học này?"
            onConfirm={() => handleDeleteCourse(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              title="Xóa khóa học"
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
              Quản lý Khóa học
            </Title>
            <Text type="secondary">Danh sách tất cả các chương trình đào tạo của Tata English Center</Text>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreateModal}>
            Thêm Khóa học
          </Button>
        </div>
      </Card>

      {/* Filters Card */}
      <Card bordered={false} style={{ marginBottom: "16px", borderRadius: "8px" }}>
        <Space wrap size="large">
          <Input
            placeholder="Tìm theo tên khóa học, mô tả..."
            prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: "300px" }}
            allowClear
          />
          <Select
            placeholder="Lọc theo danh mục"
            style={{ width: "200px" }}
            value={selectedCategory}
            onChange={(val) => setSelectedCategory(val)}
            allowClear
          >
            {categories.map((cat) => (
              <Option key={cat.id} value={cat.id}>
                {cat.category_name}
              </Option>
            ))}
          </Select>
        </Space>
      </Card>

      {/* Table Card */}
      <Card bordered={false} style={{ borderRadius: "8px" }}>
        <Table
          dataSource={filteredCourses}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 8 }}
          locale={{ emptyText: "Không tìm thấy khóa học nào" }}
        />
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        title={editingCourse ? "Chỉnh sửa Khóa học" : "Tạo Khóa học Mới"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
          <Form.Item
            name="category_id"
            label="Danh mục khóa học"
            rules={[{ required: true, message: "Vui lòng chọn danh mục!" }]}
          >
            <Select placeholder="Chọn danh mục">
              {categories.map((cat) => (
                <Option key={cat.id} value={cat.id}>
                  {cat.category_name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="course_name"
            label="Tên khóa học"
            rules={[{ required: true, message: "Vui lòng nhập tên khóa học!" }]}
          >
            <Input placeholder="Ví dụ: IELTS Intensive, Business English" />
          </Form.Item>

          <Form.Item
            name="level"
            label="Trình độ"
            rules={[{ required: true, message: "Vui lòng chọn trình độ học viên!" }]}
          >
            <Select placeholder="Chọn trình độ">
              <Option value="Beginner">Beginner (Mới bắt đầu)</Option>
              <Option value="Elementary">Elementary (Cơ bản)</Option>
              <Option value="Intermediate">Intermediate (Trung cấp)</Option>
              <Option value="Advanced">Advanced (Nâng cao)</Option>
              <Option value="IELTS 5.0-6.0">IELTS 5.0 - 6.0</Option>
              <Option value="IELTS 6.5+">IELTS 6.5+</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="tuition_fee"
            label="Học phí (VND)"
            rules={[{ required: true, message: "Vui lòng nhập học phí!" }]}
          >
            <InputNumber
              style={{ width: "100%" }}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              parser={(value) => value ? value.replace(/\$\s?|(,*)/g, "") as any : ""}
              placeholder="Ví dụ: 3,500,000"
              min={0}
            />
          </Form.Item>

          <Form.Item
            name="duration"
            label="Thời lượng khóa học"
            rules={[{ required: true, message: "Vui lòng nhập thời lượng khóa học!" }]}
          >
            <Input placeholder="Ví dụ: 3 tháng (24 buổi), 12 tuần" />
          </Form.Item>

          <Form.Item name="description" label="Mô tả khóa học">
            <TextArea rows={4} placeholder="Tóm tắt nội dung chương trình học, mục tiêu đạt được..." />
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

export default AdminCoursesPage;
