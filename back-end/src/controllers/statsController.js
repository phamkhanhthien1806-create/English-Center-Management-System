import pool from "../config/db.js";

export const getOverview = async (req, res) => {
  try {
    const [[{ total_students }]] = await pool.query("SELECT COUNT(*) AS total_students FROM users WHERE role = 'học viên'");
    const [[{ total_courses }]] = await pool.query("SELECT COUNT(*) AS total_courses FROM courses");
    const [[{ total_classes }]] = await pool.query("SELECT COUNT(*) AS total_classes FROM classes");
    const [[{ pending_enrollments }]] = await pool.query("SELECT COUNT(*) AS pending_enrollments FROM enrollments WHERE status = 'chờ duyệt'");
    const [[{ total_revenue }]] = await pool.query("SELECT COALESCE(SUM(amount), 0) AS total_revenue FROM payments WHERE payment_status = 'đã thanh toán'");
    const [[{ month_revenue }]] = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) AS month_revenue FROM payments
      WHERE payment_status = 'đã thanh toán'
        AND MONTH(payment_date) = MONTH(CURDATE())
        AND YEAR(payment_date) = YEAR(CURDATE())
    `);

    res.status(200).json({ total_students, total_courses, total_classes, pending_enrollments, total_revenue, month_revenue });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
  }
};

export const getRevenue = async (req, res) => {
  const { year } = req.query;
  const targetYear = year || new Date().getFullYear();
  try {
    const [rows] = await pool.query(`
      SELECT MONTH(payment_date) AS month, SUM(amount) AS revenue
      FROM payments
      WHERE payment_status = 'đã thanh toán' AND YEAR(payment_date) = ?
      GROUP BY MONTH(payment_date)
      ORDER BY month
    `, [targetYear]);
    // Điền đủ 12 tháng
    const result = Array.from({ length: 12 }, (_, i) => {
      const found = rows.find(r => r.month === i + 1);
      return { month: i + 1, revenue: found ? Number(found.revenue) : 0 };
    });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
  }
};

export const getStudentsPerCourse = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.id, c.course_name, COUNT(DISTINCT e.student_id) AS student_count
      FROM courses c
      LEFT JOIN classes cl ON cl.course_id = c.id
      LEFT JOIN enrollments e ON e.class_id = cl.id AND e.status = 'đã duyệt'
      GROUP BY c.id, c.course_name
      ORDER BY student_count DESC
    `);
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
  }
};

export const getAvgScores = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT cl.id, cl.class_name, c.course_name,
             ROUND(AVG(s.score), 2) AS avg_score, COUNT(s.id) AS scored_students
      FROM classes cl
      JOIN courses c ON cl.course_id = c.id
      LEFT JOIN scores s ON s.class_id = cl.id
      GROUP BY cl.id, cl.class_name, c.course_name
      ORDER BY avg_score DESC
    `);
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
  }
};
