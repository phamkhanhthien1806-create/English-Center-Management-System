import pool from "../config/db.js";

export const getMyEnrollments = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT e.*, cl.class_name, cl.start_date, cl.end_date,
             c.course_name, c.tuition_fee, c.level,
             t.full_name AS teacher_name,
             p.payment_status, p.amount, p.payment_date
      FROM enrollments e
      JOIN classes cl ON e.class_id = cl.id
      JOIN courses c ON cl.course_id = c.id
      JOIN teachers t ON cl.teacher_id = t.id
      LEFT JOIN payments p ON p.enrollment_id = e.id
      WHERE e.student_id = ?
      ORDER BY e.enroll_date DESC
    `, [req.user.id]);
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
  }
};

export const getAllEnrollments = async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT e.*, u.full_name AS student_name, u.email AS student_email,
             cl.class_name, c.course_name, c.tuition_fee,
             p.payment_status, p.amount
      FROM enrollments e
      JOIN users u ON e.student_id = u.id
      JOIN classes cl ON e.class_id = cl.id
      JOIN courses c ON cl.course_id = c.id
      LEFT JOIN payments p ON p.enrollment_id = e.id
    `;
    const params = [];
    if (status) { query += " WHERE e.status = ?"; params.push(status); }
    query += " ORDER BY e.enroll_date DESC";
    const [rows] = await pool.query(query, params);
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
  }
};

export const createEnrollment = async (req, res) => {
  const { class_id } = req.body;
  const student_id = req.user.id;
  try {
    if (!class_id) return res.status(400).json({ message: "Thiếu class_id" });

    const [existing] = await pool.query(
      "SELECT id FROM enrollments WHERE student_id = ? AND class_id = ?",
      [student_id, class_id]
    );
    if (existing.length > 0) return res.status(400).json({ message: "Bạn đã đăng ký lớp học này rồi" });

    const [classInfo] = await pool.query(`
      SELECT cl.*, c.tuition_fee,
        (SELECT COUNT(*) FROM enrollments WHERE class_id = cl.id AND status = 'đã duyệt') AS enrolled_count
      FROM classes cl JOIN courses c ON cl.course_id = c.id WHERE cl.id = ?
    `, [class_id]);
    if (classInfo.length === 0) return res.status(404).json({ message: "Không tìm thấy lớp học" });
    if (classInfo[0].enrolled_count >= classInfo[0].max_students) {
      return res.status(400).json({ message: "Lớp học đã đủ sĩ số" });
    }

    const [result] = await pool.query(
      "INSERT INTO enrollments (student_id, class_id, status) VALUES (?, ?, 'chờ duyệt')",
      [student_id, class_id]
    );

    // Tạo bản ghi payment mặc định
    await pool.query(
      "INSERT INTO payments (enrollment_id, payment_method_id, amount, payment_status) VALUES (?, 1, ?, 'chờ thanh toán')",
      [result.insertId, classInfo[0].tuition_fee]
    );

    res.status(201).json({ message: "Đăng ký lớp học thành công, đang chờ duyệt", enrollmentId: result.insertId });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
  }
};

export const updateEnrollmentStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const allowed = ["chờ duyệt", "đã duyệt", "từ chối"];
  try {
    if (!allowed.includes(status)) return res.status(400).json({ message: "Trạng thái không hợp lệ" });
    const [check] = await pool.query("SELECT id FROM enrollments WHERE id = ?", [id]);
    if (check.length === 0) return res.status(404).json({ message: "Không tìm thấy đăng ký" });

    await pool.query("UPDATE enrollments SET status = ? WHERE id = ?", [status, id]);

    if (status === "từ chối") {
      await pool.query(
        "UPDATE payments SET payment_status = 'thất bại' WHERE enrollment_id = ?",
        [id]
      );
    }

    const [enrollment] = await pool.query("SELECT student_id, class_id FROM enrollments WHERE id = ?", [id]);
    const [cls] = await pool.query("SELECT class_name FROM classes WHERE id = ?", [enrollment[0].class_id]);
    let title = "", message = "";
    if (status === "đã duyệt") {
      title = "Đăng ký được duyệt";
      message = `Đơn đăng ký lớp ${cls[0].class_name} của bạn đã được duyệt thành công.`;
    } else if (status === "từ chối") {
      title = "Đăng ký bị từ chối";
      message = `Rất tiếc, đơn đăng ký lớp ${cls[0].class_name} của bạn đã bị từ chối.`;
    }
    if (title) {
      await pool.query(
        "INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)",
        [enrollment[0].student_id, title, message]
      );
    }

    res.status(200).json({ message: "Cập nhật trạng thái đăng ký thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
  }
};
