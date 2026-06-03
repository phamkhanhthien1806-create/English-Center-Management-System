import pool from "../config/db.js";

export const getStudents = async (req, res) => {
  try {
    const { search, status } = req.query;
    let query = `
      SELECT u.id, u.full_name, u.email, u.phone, u.status, u.created_at,
             sp.birthday, sp.gender, sp.avatar,
             COUNT(DISTINCT e.id) AS total_enrollments
      FROM users u
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
      LEFT JOIN enrollments e ON u.id = e.student_id
      WHERE u.role = 'học viên'
    `;
    const params = [];
    if (search) {
      query += " AND (u.full_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (status) { query += " AND u.status = ?"; params.push(status); }
    query += " GROUP BY u.id ORDER BY u.created_at DESC";
    const [rows] = await pool.query(query, params);
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
  }
};

export const getStudentById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT u.id, u.full_name, u.email, u.phone, u.status, u.created_at,
             sp.birthday, sp.gender, sp.address, sp.avatar
      FROM users u
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
      WHERE u.id = ? AND u.role = 'học viên'
    `, [id]);
    if (rows.length === 0) return res.status(404).json({ message: "Không tìm thấy học viên" });

    const [enrollments] = await pool.query(`
      SELECT e.*, cl.class_name, c.course_name, s.score
      FROM enrollments e
      JOIN classes cl ON e.class_id = cl.id
      JOIN courses c ON cl.course_id = c.id
      LEFT JOIN scores s ON s.student_id = e.student_id AND s.class_id = e.class_id
      WHERE e.student_id = ?
    `, [id]);

    res.status(200).json({ student: rows[0], enrollments });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
  }
};

export const updateStudentStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    if (!["hoạt động", "bị khóa"].includes(status)) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ" });
    }
    const [check] = await pool.query("SELECT id FROM users WHERE id = ? AND role = 'học viên'", [id]);
    if (check.length === 0) return res.status(404).json({ message: "Không tìm thấy học viên" });
    await pool.query("UPDATE users SET status = ? WHERE id = ?", [status, id]);
    res.status(200).json({ message: `Tài khoản đã được ${status === "bị khóa" ? "khóa" : "mở khóa"}` });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
  }
};
