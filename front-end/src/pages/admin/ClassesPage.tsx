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
  DatePicker,
  Popconfirm,
  message,
  Typography,
  Card,
  Tag,
  Row,
  Col,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import api from "../../utils/api";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;

interface Teacher {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  specialization: string;
}

interface Course {
  id: number;
  course_name: string;
}

interface ClassSchedule {
  id: number;
  class_id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  room: string;
}

interface ClassItem {
  id: number;
  course_id: number;
  course_name: string;
  teacher_id: number;
  teacher_name: string;
  class_name: string;
  start_date: string;
  end_date: string;
  max_students: number;
}

const AdminClassesPage: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);

  // Search/Filters
  const [searchText, setSearchText] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);

  // Class Modal State
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [classForm] = Form.useForm();
  const [classSubmitting, setClassSubmitting] = useState(false);

  // Schedule Modal State
  const [isSchedModalOpen, setIsSchedModalOpen] = useState(false);
  const [selectedClassForSched, setSelectedClassForSched] = useState<ClassItem | null>(null);
  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [schedLoading, setSchedLoading] = useState(false);
  const [schedForm] = Form.useForm();
  const [schedSubmitting, setSchedSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [classesRes, coursesRes, teachersRes] = await Promise.all([
        api.get("/classes"),
        api.get("/courses"),
        api.get("/teachers"),
      ]);
      setClasses(classesRes.data);
      setCourses(coursesRes.data);
      setTeachers(teachersRes.data);
    } catch (error) {
      console.error("Lỗi tải danh sách lớp học:", error);
      message.error("Không thể tải dữ liệu lớp học");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Class CRUD Actions
  const handleOpenCreateClass = () => {
    setEditingClass(null);
    classForm.resetFields();
    setIsClassModalOpen(true);
  };

  const handleOpenEditClass = (item: ClassItem) => {
    setEditingClass(item);
    classForm.setFieldsValue({
      class_name: item.class_name,
      course_id: item.course_id,
      teacher_id: item.teacher_id,
      max_students: item.max_students,
      dates: [
        item.start_date ? dayjs(item.start_date) : null,
        item.end_date ? dayjs(item.end_date) : null,
      ],
    });
    setIsClassModalOpen(true);
  };

  const handleClassSubmit = async (values: any) => {
    try {
      setClassSubmitting(true);
      const startDate = values.dates && values.dates[0] ? values.dates[0].format("YYYY-MM-DD") : null;
      const endDate = values.dates && values.dates[1] ? values.dates[1].format("YYYY-MM-DD") : null;

      const payload = {
        class_name: values.class_name,
        course_id: values.course_id,
        teacher_id: values.teacher_id,
        max_students: values.max_students,
        start_date: startDate,
        end_date: endDate,
      };

      if (editingClass) {
        await api.put(`/classes/${editingClass.id}`, payload);
        message.success("Cập nhật thông tin lớp học thành công");
      } else {
        await api.post("/classes", payload);
        message.success("Tạo lớp học mới thành công");
      }
      setIsClassModalOpen(false);
      fetchData();
    } catch (error: any) {
      console.error("Lỗi lưu lớp học:", error);
      message.error(error.response?.data?.message || "Có lỗi xảy ra khi lưu lớp học");
    } finally {
      setClassSubmitting(false);
    }
  };

  const handleDeleteClass = async (id: number) => {
    try {
      await api.delete(`/classes/${id}`);
      message.success("Xóa lớp học thành công");
      fetchData();
    } catch (error: any) {
      console.error("Lỗi xóa lớp học:", error);
      message.error(error.response?.data?.message || "Không thể xóa lớp học này");
    }
  };

  // Schedule Modal Actions
  const handleOpenScheduleModal = async (item: ClassItem) => {
    setSelectedClassForSched(item);
    setIsSchedModalOpen(true);
    schedForm.resetFields();
    fetchClassSchedules(item.id);
  };

  const fetchClassSchedules = async (classId: number) => {
    try {
      setSchedLoading(true);
      const res = await api.get(`/classes/${classId}`);
      setSchedules(res.data.schedules || []);
    } catch (error) {
      console.error("Lỗi tải lịch học:", error);
      message.error("Không thể tải lịch học của lớp");
    } finally {
      setSchedLoading(false);
    }
  };

  const handleAddScheduleSubmit = async (values: any) => {
    if (!selectedClassForSched) return;
    try {
      setSchedSubmitting(true);
      const payload = {
        day_of_week: values.day_of_week,
        start_time: values.start_time,
        end_time: values.end_time,
        room: values.room,
      };

      await api.post(`/classes/${selectedClassForSched.id}/schedules`, payload);
      message.success("Thêm lịch học thành công");
      schedForm.resetFields();
      fetchClassSchedules(selectedClassForSched.id);
    } catch (error: any) {
      console.error("Lỗi thêm lịch học:", error);
      message.error(error.response?.data?.message || "Không thể thêm lịch học");
    } finally {
      setSchedSubmitting(false);
    }
  };

  const handleDeleteSchedule = async (schedId: number) => {
    if (!selectedClassForSched) return;
    try {
      await api.delete(`/classes/schedules/${schedId}`);
      message.success("Xóa lịch học thành công");
      fetchClassSchedules(selectedClassForSched.id);
    } catch (error) {
      console.error("Lỗi xóa lịch học:", error);
      message.error("Không thể xóa lịch học");
    }
  };

  // Filtering
  const filteredClasses = classes.filter((item) => {
    const matchesSearch =
      item.class_name.toLowerCase().includes(searchText.toLowerCase()) ||
      item.teacher_name?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.course_name?.toLowerCase().includes(searchText.toLowerCase());

    const matchesCourse = selectedCourse ? item.course_id === selectedCourse : true;

    return matchesSearch && matchesCourse;
  });

  const columns = [
    {
      title: "Tên Lớp Học",
      dataIndex: "class_name",
      key: "class_name",
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: "Khóa Học",
      dataIndex: "course_name",
      key: "course_name",
    },
    {
      title: "Giảng Viên",
      dataIndex: "teacher_name",
      key: "teacher_name",
      render: (text: string) => <Tag color="blue">{text || "Chưa phân công"}</Tag>,
    },
    {
      title: "Sĩ Số Tối Đa",
      dataIndex: "max_students",
      key: "max_students",
      render: (max: number) => `${max} học viên`,
    },
    {
      title: "Thời Gian Học",
      key: "date_range",
      render: (_: any, record: ClassItem) => {
        const start = record.start_date ? dayjs(record.start_date).format("DD/MM/YYYY") : "N/A";
        const end = record.end_date ? dayjs(record.end_date).format("DD/MM/YYYY") : "N/A";
        return (
          <div style={{ fontSize: "12px" }}>
            {start} - {end}
          </div>
        );
      },
    },
    {
      title: "Thao Tác",
      key: "actions",
      width: 220,
      render: (_: any, record: ClassItem) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EditOutlined style={{ color: "#1890ff" }} />}
            onClick={() => handleOpenEditClass(record)}
            title="Chỉnh sửa thông tin"
          />
          <Button
            type="text"
            icon={<CalendarOutlined style={{ color: "#52c41a" }} />}
            onClick={() => handleOpenScheduleModal(record)}
            title="Thiết lập lịch học"
          />
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa lớp học này?"
            onConfirm={() => handleDeleteClass(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              title="Xóa lớp"
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
              Quản lý Lớp học
            </Title>
            <Text type="secondary">Quản lý lớp học, phân công giảng dạy và thiết lập lịch học cho các khóa đào tạo</Text>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreateClass}>
            Thêm Lớp học
          </Button>
        </div>
      </Card>

      {/* Filters Card */}
      <Card bordered={false} style={{ marginBottom: "16px", borderRadius: "8px" }}>
        <Space wrap size="large">
          <Input
            placeholder="Tìm theo tên lớp, giảng viên, khóa học..."
            prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: "300px" }}
            allowClear
          />
          <Select
            placeholder="Lọc theo khóa học"
            style={{ width: "220px" }}
            value={selectedCourse}
            onChange={(val) => setSelectedCourse(val)}
            allowClear
          >
            {courses.map((course) => (
              <Option key={course.id} value={course.id}>
                {course.course_name}
              </Option>
            ))}
          </Select>
        </Space>
      </Card>

      {/* Table Card */}
      <Card bordered={false} style={{ borderRadius: "8px" }}>
        <Table
          dataSource={filteredClasses}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 8 }}
          locale={{ emptyText: "Không tìm thấy lớp học nào" }}
        />
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        title={editingClass ? "Chỉnh sửa Lớp học" : "Tạo Lớp học Mới"}
        open={isClassModalOpen}
        onCancel={() => setIsClassModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={classForm} layout="vertical" onFinish={handleClassSubmit}>
          <Form.Item
            name="class_name"
            label="Tên lớp học"
            rules={[{ required: true, message: "Vui lòng nhập tên lớp học!" }]}
          >
            <Input placeholder="Ví dụ: Business English B11, IELTS Special" />
          </Form.Item>

          <Form.Item
            name="course_id"
            label="Khóa học"
            rules={[{ required: true, message: "Vui lòng chọn khóa học!" }]}
          >
            <Select placeholder="Chọn khóa học">
              {courses.map((c) => (
                <Option key={c.id} value={c.id}>
                  {c.course_name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="teacher_id"
            label="Giảng viên phụ trách"
            rules={[{ required: true, message: "Vui lòng chọn giảng viên!" }]}
          >
            <Select placeholder="Chọn giảng viên">
              {teachers.map((t) => (
                <Option key={t.id} value={t.id}>
                  {t.full_name} ({t.specialization || "Giảng viên"})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="dates" label="Thời gian diễn ra lớp học">
            <DatePicker.RangePicker style={{ width: "100%" }} format="DD/MM/YYYY" placeholder={["Bắt đầu", "Kết thúc"]} />
          </Form.Item>

          <Form.Item
            name="max_students"
            label="Số lượng học viên tối đa"
            rules={[{ required: true, message: "Vui lòng nhập số học viên tối đa!" }]}
            initialValue={30}
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button onClick={() => setIsClassModalOpen(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={classSubmitting}>
                Lưu lại
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Schedule Settings Modal */}
      <Modal
        title={
          <span>
            <CalendarOutlined style={{ color: "#52c41a", marginRight: "8px" }} />
            Thiết lập lịch học: <Text strong>{selectedClassForSched?.class_name}</Text>
          </span>
        }
        open={isSchedModalOpen}
        onCancel={() => setIsSchedModalOpen(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        <div style={{ marginBottom: "20px" }}>
          <Title level={5} style={{ borderBottom: "1px solid #f0f0f0", paddingBottom: "8px" }}>
            Lịch học hiện tại
          </Title>
          <Table
            dataSource={schedules}
            rowKey="id"
            loading={schedLoading}
            size="small"
            pagination={false}
            columns={[
              { title: "Thứ", dataIndex: "day_of_week", key: "day_of_week" },
              {
                title: "Khung giờ",
                key: "time",
                render: (_: any, record: ClassSchedule) => `${record.start_time} - ${record.end_time}`,
              },
              { title: "Phòng học", dataIndex: "room", key: "room", render: (r) => r || "N/A" },
              {
                title: "Thao tác",
                key: "action",
                width: 80,
                render: (_: any, record: ClassSchedule) => (
                  <Popconfirm
                    title="Xóa buổi học này?"
                    onConfirm={() => handleDeleteSchedule(record.id)}
                    okText="Xóa"
                    cancelText="Hủy"
                    okButtonProps={{ danger: true }}
                  >
                    <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                  </Popconfirm>
                ),
              },
            ]}
            locale={{ emptyText: "Chưa thiết lập lịch học cho lớp này" }}
          />
        </div>

        <div>
          <Title level={5} style={{ borderBottom: "1px solid #f0f0f0", paddingBottom: "8px" }}>
            Thêm buổi học mới
          </Title>
          <Form form={schedForm} layout="vertical" onFinish={handleAddScheduleSubmit}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="day_of_week"
                  label="Thứ trong tuần"
                  rules={[{ required: true, message: "Chọn thứ!" }]}
                >
                  <Select placeholder="Chọn thứ">
                    <Option value="Thứ Hai">Thứ Hai</Option>
                    <Option value="Thứ Ba">Thứ Ba</Option>
                    <Option value="Thứ Tư">Thứ Tư</Option>
                    <Option value="Thứ Năm">Thứ Năm</Option>
                    <Option value="Thứ Sáu">Thứ Sáu</Option>
                    <Option value="Thứ Bảy">Thứ Bảy</Option>
                    <Option value="Chủ Nhật">Chủ Nhật</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="room"
                  label="Phòng học"
                  rules={[{ required: true, message: "Nhập phòng học!" }]}
                >
                  <Input placeholder="Ví dụ: Phòng 302, Zoom" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="start_time"
                  label="Giờ bắt đầu"
                  rules={[{ required: true, message: "Nhập giờ bắt đầu!" }]}
                >
                  <Input placeholder="Ví dụ: 08:30 hoặc 18:00" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="end_time"
                  label="Giờ kết thúc"
                  rules={[{ required: true, message: "Nhập giờ kết thúc!" }]}
                >
                  <Input placeholder="Ví dụ: 10:30 hoặc 20:00" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
              <Button type="primary" htmlType="submit" loading={schedSubmitting} icon={<PlusOutlined />}>
                Thêm buổi học
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </div>
  );
};

export default AdminClassesPage;
