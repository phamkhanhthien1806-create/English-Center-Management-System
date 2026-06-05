import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Select,
  Modal,
  Form,
  InputNumber,
  Input,
  Space,
  Tag,
  message,
  Typography,
  Card,
} from "antd";
import { EditOutlined, SearchOutlined } from "@ant-design/icons";
import api from "../../utils/api";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface ClassItem {
  id: number;
  class_name: string;
  course_name: string;
}

interface StudentScoreItem {
  id: number; // student_id
  full_name: string;
  email: string;
  score: number | string | null;
  comment: string | null;
  score_id: number | null;
}

const AdminScoresPage: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [students, setStudents] = useState<StudentScoreItem[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [searchText, setSearchText] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentScoreItem | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // Load all classes for dropdown selection
  const fetchClasses = async () => {
    try {
      setLoadingClasses(true);
      const res = await api.get("/classes");
      setClasses(res.data);
    } catch (error) {
      console.error("Lỗi tải danh sách lớp học:", error);
      message.error("Không thể tải danh sách lớp học");
    } finally {
      setLoadingClasses(false);
    }
  };

  // Load students with scores of the selected class
  const fetchStudents = async (classId: number) => {
    try {
      setLoadingStudents(true);
      const res = await api.get(`/scores/class/${classId}/students`);
      setStudents(res.data);
    } catch (error) {
      console.error("Lỗi tải bảng điểm:", error);
      message.error("Không thể tải danh sách học viên lớp này");
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      fetchStudents(selectedClassId);
    } else {
      setStudents([]);
    }
  }, [selectedClassId]);

  const handleOpenEditModal = (student: StudentScoreItem) => {
    setSelectedStudent(student);
    form.setFieldsValue({
      score: student.score !== null ? Number(student.score) : undefined,
      comment: student.comment || "",
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (values: any) => {
    if (!selectedClassId || !selectedStudent) return;
    try {
      setSubmitting(true);
      const payload = {
        student_id: selectedStudent.id,
        class_id: selectedClassId,
        score: values.score,
        comment: values.comment || null,
      };

      await api.post("/scores", payload);
      message.success(`Đã cập nhật điểm học viên ${selectedStudent.full_name} thành công`);
      setIsModalOpen(false);
      fetchStudents(selectedClassId);
    } catch (error: any) {
      console.error("Lỗi lưu điểm:", error);
      message.error(error.response?.data?.message || "Không thể cập nhật điểm số");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter students based on local search text
  const filteredStudents = students.filter((student) => {
    const term = searchText.toLowerCase();
    return (
      student.full_name.toLowerCase().includes(term) ||
      student.email.toLowerCase().includes(term)
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
      title: "Điểm Số",
      dataIndex: "score",
      key: "score",
      align: "center" as const,
      render: (score: number | string | null) => {
        if (score === null || score === undefined) {
          return <Tag color="default">Chưa nhập</Tag>;
        }
        const val = Number(score);
        let color = "red";
        if (val >= 8) color = "green";
        else if (val >= 5) color = "blue";
        return (
          <Tag color={color} style={{ fontWeight: "bold", fontSize: "14px" }}>
            {score}
          </Tag>
        );
      },
      sorter: (a: StudentScoreItem, b: StudentScoreItem) => {
        const scoreA = a.score !== null ? Number(a.score) : -1;
        const scoreB = b.score !== null ? Number(b.score) : -1;
        return scoreA - scoreB;
      },
    },
    {
      title: "Nhận Xét",
      dataIndex: "comment",
      key: "comment",
      ellipsis: true,
      render: (text: string) => text || <Text type="secondary">-</Text>,
    },
    {
      title: "Thao Tác",
      key: "actions",
      width: 100,
      render: (_: any, record: StudentScoreItem) => (
        <Button
          type="text"
          icon={<EditOutlined style={{ color: "#1890ff" }} />}
          onClick={() => handleOpenEditModal(record)}
          title="Nhập / Sửa điểm"
        />
      ),
    },
  ];

  return (
    <div>
      <Card bordered={false} style={{ marginBottom: "16px", borderRadius: "8px" }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>
            Quản lý Điểm số
          </Title>
          <Text type="secondary">Nhập điểm, cập nhật kết quả học tập và nhận xét cho học viên theo từng lớp học</Text>
        </div>
      </Card>

      {/* Class Selector Card */}
      <Card bordered={false} style={{ marginBottom: "16px", borderRadius: "8px" }}>
        <Space size="large" wrap>
          <div>
            <Text style={{ marginRight: "8px" }}>Chọn lớp học:</Text>
            <Select
              placeholder="Chọn một lớp học để nhập điểm"
              style={{ width: "300px" }}
              value={selectedClassId}
              onChange={(val) => setSelectedClassId(val)}
              loading={loadingClasses}
              allowClear
            >
              {classes.map((c) => (
                <Option key={c.id} value={c.id}>
                  {c.class_name} ({c.course_name})
                </Option>
              ))}
            </Select>
          </div>

          {selectedClassId && (
            <Input
              placeholder="Tìm học viên trong lớp..."
              prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: "250px" }}
              allowClear
            />
          )}
        </Space>
      </Card>

      {/* Score List Table */}
      {selectedClassId ? (
        <Card bordered={false} style={{ borderRadius: "8px" }}>
          <Table
            dataSource={filteredStudents}
            columns={columns}
            rowKey="id"
            loading={loadingStudents}
            pagination={false}
            locale={{ emptyText: "Không có học viên nào đã duyệt trong lớp học này" }}
          />
        </Card>
      ) : (
        <Card bordered={false} style={{ borderRadius: "8px", textAlign: "center", padding: "40px 0" }}>
          <Text type="secondary" style={{ fontSize: "16px" }}>
            Vui lòng chọn một lớp học phía trên để hiển thị danh sách nhập điểm
          </Text>
        </Card>
      )}

      {/* Edit Score Modal */}
      <Modal
        title={`Cập nhật điểm học viên: ${selectedStudent?.full_name}`}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
          <Form.Item
            name="score"
            label="Điểm số (Thang điểm 0 - 10)"
            rules={[
              { required: true, message: "Vui lòng nhập điểm!" },
              { type: "number", min: 0, max: 10, message: "Điểm số phải từ 0 đến 10!" },
            ]}
          >
            <InputNumber
              min={0}
              max={10}
              step={0.1}
              style={{ width: "100%" }}
              placeholder="Nhập số điểm (ví dụ: 8.5)"
            />
          </Form.Item>

          <Form.Item name="comment" label="Nhận xét của giảng viên">
            <TextArea rows={4} placeholder="Nhập nhận xét về tình hình học tập của học viên..." />
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

export default AdminScoresPage;
