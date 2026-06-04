import React, { useState, useEffect } from "react";
import { Row, Col, Card, Statistic, Table, Tag, Typography, Spin, message, Space } from "antd";
import {
  UserOutlined,
  BookOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  LineChartOutlined,
} from "@ant-design/icons";
import api from "../../utils/api";

const { Title, Text } = Typography;

interface StatsOverview {
  total_students: number;
  total_courses: number;
  total_classes: number;
  pending_enrollments: number;
  total_revenue: number;
  month_revenue: number;
}

interface MonthlyRevenue {
  month: number;
  revenue: number;
}

interface StudentsPerCourse {
  id: number;
  course_name: string;
  student_count: number;
}

interface AvgScore {
  id: number;
  class_name: string;
  course_name: string;
  avg_score: number | string;
  scored_students: number;
}

interface Enrollment {
  id: number;
  student_name: string;
  student_email: string;
  class_name: string;
  course_name: string;
  tuition_fee: number;
  status: string;
  payment_status: string;
  enroll_date: string;
}

const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<StatsOverview | null>(null);
  const [revenueData, setRevenueData] = useState<MonthlyRevenue[]>([]);
  const [coursesStats, setCoursesStats] = useState<StudentsPerCourse[]>([]);
  const [avgScores, setAvgScores] = useState<AvgScore[]>([]);
  const [recentEnrollments, setRecentEnrollments] = useState<Enrollment[]>([]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [overviewRes, revenueRes, coursesRes, scoresRes, enrollmentsRes] = await Promise.all([
        api.get("/stats/overview"),
        api.get("/stats/revenue"),
        api.get("/stats/students-per-course"),
        api.get("/stats/avg-scores"),
        api.get("/enrollments/all"),
      ]);

      setOverview(overviewRes.data);
      setRevenueData(revenueRes.data);
      setCoursesStats(coursesRes.data);
      setAvgScores(scoresRes.data);
      setRecentEnrollments(enrollmentsRes.data.slice(0, 5));
    } catch (error: any) {
      console.error("Lỗi lấy dữ liệu dashboard:", error);
      message.error(error.response?.data?.message || "Không thể lấy dữ liệu thống kê");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: "400px", flexDirection: "column", gap: "16px" }}>
        <Spin size="large" />
        <Text type="secondary">Đang tải dữ liệu thống kê hệ thống...</Text>
      </div>
    );
  }

  // Format currency
  const formatVND = (value: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
  };

  // Find max revenue for chart scaling
  const maxRevenue = Math.max(...revenueData.map((d) => d.revenue), 1);

  return (
    <div style={{ padding: "8px 0" }}>
      <div style={{ marginBottom: "24px" }}>
        <Title level={3} style={{ margin: 0, color: "#111b26" }}>
          Hệ thống Quản lý Tata English Center
        </Title>
        <Text type="secondary">Tổng quan hoạt động và chỉ số vận hành trung tâm</Text>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        <Col xs={24} sm={12} md={6}>
          <Card
            bordered={false}
            style={{
              background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(24,144,255,0.15)",
            }}
          >
            <Statistic
              title={<span style={{ color: "rgba(255,255,255,0.85)" }}>Tổng Học Viên</span>}
              value={overview?.total_students || 0}
              valueStyle={{ color: "#fff", fontWeight: "bold", fontSize: "28px" }}
              prefix={<UserOutlined style={{ color: "rgba(255,255,255,0.9)", marginRight: "8px" }} />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card
            bordered={false}
            style={{
              background: "linear-gradient(135deg, #52c41a 0%, #389e0d 100%)",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(82,196,26,0.15)",
            }}
          >
            <Statistic
              title={<span style={{ color: "rgba(255,255,255,0.85)" }}>Khóa Học Hoạt Động</span>}
              value={overview?.total_courses || 0}
              valueStyle={{ color: "#fff", fontWeight: "bold", fontSize: "28px" }}
              prefix={<BookOutlined style={{ color: "rgba(255,255,255,0.9)", marginRight: "8px" }} />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card
            bordered={false}
            style={{
              background: "linear-gradient(135deg, #fa8c16 0%, #d46b08 100%)",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(250,140,22,0.15)",
            }}
          >
            <Statistic
              title={<span style={{ color: "rgba(255,255,255,0.85)" }}>Lớp Học Đang Mở</span>}
              value={overview?.total_classes || 0}
              valueStyle={{ color: "#fff", fontWeight: "bold", fontSize: "28px" }}
              prefix={<CalendarOutlined style={{ color: "rgba(255,255,255,0.9)", marginRight: "8px" }} />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card
            bordered={false}
            style={{
              background: "linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%)",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(255,77,79,0.15)",
            }}
          >
            <Statistic
              title={<span style={{ color: "rgba(255,255,255,0.85)" }}>Đăng Ký Chờ Duyệt</span>}
              value={overview?.pending_enrollments || 0}
              valueStyle={{ color: "#fff", fontWeight: "bold", fontSize: "28px" }}
              prefix={<ClockCircleOutlined style={{ color: "rgba(255,255,255,0.9)", marginRight: "8px" }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* Revenue & Recent Enrollments */}
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        {/* Left: Revenue Chart */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <LineChartOutlined style={{ color: "#1890ff" }} />
                <span>Doanh thu tháng (Năm {new Date().getFullYear()})</span>
              </Space>
            }
            bordered={false}
            style={{ borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", height: "100%" }}
            extra={
              <div style={{ textAlign: "right" }}>
                <Text type="secondary" style={{ fontSize: "12px" }}>Doanh thu tháng này</Text>
                <div style={{ fontWeight: "bold", color: "#1890ff", fontSize: "16px" }}>
                  {formatVND(overview?.month_revenue || 0)}
                </div>
              </div>
            }
          >
            {/* Custom SVG Bar Chart */}
            <div style={{ width: "100%", height: "260px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "flex-end", height: "220px", width: "100%", padding: "0 10px", gap: "8px" }}>
                {revenueData.map((d) => {
                  const heightPercent = (d.revenue / maxRevenue) * 90 + 5; // scaled with 5% min height
                  return (
                    <div
                      key={d.month}
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        height: "100%",
                        justifyContent: "flex-end",
                      }}
                    >
                      {/* Bar tooltip hover container */}
                      <div className="chart-bar-container" style={{ width: "100%", position: "relative", display: "flex", justifyContent: "center" }}>
                        <div
                          className="chart-bar-tooltip"
                          style={{
                            position: "absolute",
                            bottom: `${heightPercent + 10}%`,
                            background: "rgba(0,0,0,0.8)",
                            color: "#fff",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            whiteSpace: "nowrap",
                            zIndex: 10,
                            pointerEvents: "none",
                            opacity: 0,
                            transition: "opacity 0.2s",
                            boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
                          }}
                        >
                          {formatVND(d.revenue)}
                        </div>
                        <div
                          style={{
                            width: "80%",
                            height: `${heightPercent}%`,
                            background: "linear-gradient(to top, #1890ff, #40a9ff)",
                            borderRadius: "4px 4px 0 0",
                            cursor: "pointer",
                            transition: "all 0.3s",
                          }}
                          onMouseEnter={(e) => {
                            const tooltip = e.currentTarget.previousElementSibling as HTMLElement;
                            if (tooltip) tooltip.style.opacity = "1";
                            e.currentTarget.style.filter = "brightness(1.1)";
                          }}
                          onMouseLeave={(e) => {
                            const tooltip = e.currentTarget.previousElementSibling as HTMLElement;
                            if (tooltip) tooltip.style.opacity = "0";
                            e.currentTarget.style.filter = "none";
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* X-axis labels */}
              <div style={{ display: "flex", borderTop: "1px solid #f0f0f0", paddingTop: "8px", width: "100%", paddingLeft: "10px", paddingRight: "10px" }}>
                {revenueData.map((d) => (
                  <div key={d.month} style={{ flex: 1, textAlign: "center", fontSize: "11px", color: "#8c8c8c" }}>
                    T{d.month}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </Col>

        {/* Right: Recent Registrations */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <ClockCircleOutlined style={{ color: "#fa8c16" }} />
                <span>Đăng ký học viên mới nhất</span>
              </Space>
            }
            bordered={false}
            style={{ borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", height: "100%" }}
          >
            <Table
              dataSource={recentEnrollments}
              rowKey="id"
              pagination={false}
              size="small"
              columns={[
                {
                  title: "Học viên",
                  dataIndex: "student_name",
                  key: "student_name",
                  render: (text) => <Text strong>{text}</Text>,
                },
                {
                  title: "Lớp / Khóa",
                  dataIndex: "class_name",
                  key: "class_name",
                  render: (text, record) => (
                    <div>
                      <div style={{ fontSize: "12px" }}>{text}</div>
                      <div style={{ fontSize: "10px", color: "#8c8c8c" }}>{record.course_name}</div>
                    </div>
                  ),
                },
                {
                  title: "Học phí",
                  dataIndex: "payment_status",
                  key: "payment_status",
                  render: (status) => (
                    <Tag color={status === "đã thanh toán" ? "green" : "red"}>
                      {status === "đã thanh toán" ? "Đã đóng" : "Chưa đóng"}
                    </Tag>
                  ),
                },
                {
                  title: "Trạng thái",
                  dataIndex: "status",
                  key: "status",
                  render: (status) => (
                    <Tag color={status === "đã duyệt" ? "blue" : "orange"}>
                      {status.toUpperCase()}
                    </Tag>
                  ),
                },
              ]}
              locale={{ emptyText: "Chưa có lượt đăng ký nào" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Rankings / Details */}
      <Row gutter={[16, 16]}>
        {/* Left: Top courses */}
        <Col xs={24} md={12}>
          <Card title="Khóa học nhiều học viên nhất" bordered={false} style={{ borderRadius: "8px" }}>
            <Table
              dataSource={coursesStats}
              rowKey="id"
              pagination={false}
              size="small"
              columns={[
                {
                  title: "Hạng",
                  key: "index",
                  width: 60,
                  align: "center",
                  render: (_, __, index) => (
                    <span
                      style={{
                        display: "inline-block",
                        width: "20px",
                        height: "20px",
                        lineHeight: "20px",
                        borderRadius: "50%",
                        background: index === 0 ? "#ff4d4f" : index === 1 ? "#fa8c16" : index === 2 ? "#ffec3d" : "#f0f0f0",
                        color: index < 3 ? "#fff" : "#333",
                        fontWeight: "bold",
                        fontSize: "11px",
                      }}
                    >
                      {index + 1}
                    </span>
                  ),
                },
                {
                  title: "Tên Khóa học",
                  dataIndex: "course_name",
                  key: "course_name",
                },
                {
                  title: "Số học viên",
                  dataIndex: "student_count",
                  key: "student_count",
                  align: "right",
                  render: (count) => <Text strong>{count} học viên</Text>,
                },
              ]}
              locale={{ emptyText: "Không có dữ liệu" }}
            />
          </Card>
        </Col>

        {/* Right: Classes scores */}
        <Col xs={24} md={12}>
          <Card title="Điểm trung bình các lớp" bordered={false} style={{ borderRadius: "8px" }}>
            <Table
              dataSource={avgScores}
              rowKey="id"
              pagination={false}
              size="small"
              columns={[
                {
                  title: "Tên Lớp",
                  dataIndex: "class_name",
                  key: "class_name",
                },
                {
                  title: "Khóa học",
                  dataIndex: "course_name",
                  key: "course_name",
                  render: (text) => <Text type="secondary">{text}</Text>,
                },
                {
                  title: "Điểm TB",
                  dataIndex: "avg_score",
                  key: "avg_score",
                  align: "right",
                  render: (score) => {
                    const parsed = Number(score);
                    return (
                      <Tag color={parsed >= 8 ? "green" : parsed >= 5 ? "blue" : "orange"} style={{ fontWeight: "bold" }}>
                        {score || "N/A"}
                      </Tag>
                    );
                  },
                },
              ]}
              locale={{ emptyText: "Không có dữ liệu" }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;
