import React, { useEffect, useState } from "react";
import { Card, Row, Col, Statistic, Typography, Table, Tag, Spin, message } from "antd";
import {
  BookOutlined,
  TrophyOutlined,
  BellOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import type { RootState } from "../../store";
import api from "../../utils/api";

const { Title, Paragraph } = Typography;

const StudentDashboard: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [scores, setScores] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any>({ unreadCount: 0 });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [enrollRes, scoreRes, notiRes] = await Promise.all([
          api.get("/enrollments"),
          api.get("/scores/my"),
          api.get("/notifications"),
        ]);
        setEnrollments(enrollRes.data);
        setScores(scoreRes.data);
        setNotifications(notiRes.data);
      } catch (err) {
        message.error("Lỗi khi tải dữ liệu dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const approvedEnrollments = enrollments.filter((e) => e.status === "đã duyệt");
  const avgScore =
    scores.length > 0
      ? (scores.reduce((sum: number, s: any) => sum + parseFloat(s.score), 0) / scores.length).toFixed(1)
      : "—";

  const recentEnrollColumns = [
    {
      title: "Lớp học",
      dataIndex: "class_name",
      key: "class_name",
    },
    {
      title: "Khóa học",
      dataIndex: "course_name",
      key: "course_name",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const color = status === "đã duyệt" ? "green" : status === "chờ duyệt" ? "orange" : "red";
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Giáo viên",
      dataIndex: "teacher_name",
      key: "teacher_name",
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0" }}>
        <Spin size="large" tip="Đang tải dữ liệu..." />
      </div>
    );
  }

  return (
    <div>
      <Title level={3}>Xin chào, {user?.full_name}!</Title>
      <Paragraph type="secondary">
        Chào mừng bạn đến với Cổng thông tin học viên Tata English Center.
      </Paragraph>

      {/* Thống kê tổng quan */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={12} sm={12} md={6}>
          <Card hoverable>
            <Statistic
              title="Lớp đang học"
              value={approvedEnrollments.length}
              prefix={<CalendarOutlined style={{ color: "#1890ff" }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card hoverable>
            <Statistic
              title="Tổng đăng ký"
              value={enrollments.length}
              prefix={<BookOutlined style={{ color: "#52c41a" }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card hoverable>
            <Statistic
              title="Điểm trung bình"
              value={avgScore}
              prefix={<TrophyOutlined style={{ color: "#faad14" }} />}
              suffix={scores.length > 0 ? "/ 10" : ""}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card hoverable>
            <Statistic
              title="Thông báo chưa đọc"
              value={notifications.unreadCount || 0}
              prefix={<BellOutlined style={{ color: "#ff4d4f" }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* Danh sách lớp học gần đây */}
      <Card
        title="Đăng ký của tôi"
        style={{ marginTop: 24 }}
        extra={<Link to="/student/classes">Xem tất cả</Link>}
      >
        <Table
          dataSource={enrollments.slice(0, 5)}
          columns={recentEnrollColumns}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
};

export default StudentDashboard;
