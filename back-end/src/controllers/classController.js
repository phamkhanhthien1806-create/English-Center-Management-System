import pool from "../config/db.js";

export const getClasses = async (req, res) => {
  try {
    const { course_id } = req.query;
    let query = `
      SELECT cl.*, c.course_name, c.tuition_fee, t.full_name AS teacher_name
      FROM classes cl
      JOIN courses c ON cl.course_id = c.id
      JOIN teachers t ON cl.teacher_id = t.id
    `;
    const params = [];
    if (course_id) {
      query += " WHERE cl.course_id = ?";
      params.push(course_id);
    }
    query += " ORDER BY cl.created_at DESC";
    const [classes] = await pool.query(query, params);
    res.status(200).json(classes);
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
  }
};

export const getClassById = async (req, res) => {
  const { id } = req.params;
  try {
    const [classes] = await pool.query(`
      SELECT cl.*, c.course_name, c.tuition_fee, c.level, c.description,
             t.full_name AS teacher_name, t.email AS teacher_email, t.specialization
      FROM classes cl
      JOIN courses c ON cl.course_id = c.id
      JOIN teachers t ON cl.teacher_id = t.id
      WHERE cl.id = ?
    `, [id]);
    if (classes.length === 0) return res.status(404).json({ message: "Không tìm thấy lớp học" });

    const [schedules] = await pool.query(
      "SELECT * FROM class_schedules WHERE class_id = ? ORDER BY day_of_week",
      [id]
    );
    const [lessons] = await pool.query(
      "SELECT id, lesson_title, lesson_order, created_at FROM lessons WHERE class_id = ? ORDER BY lesson_order",
      [id]
    );
    res.status(200).json({ class: classes[0], schedules, lessons });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
  }
};

export const createClass = async (req, res) => {
  const { course_id, teacher_id, class_name, start_date, end_date, max_students, schedules } = req.body;
  try {
    if (!course_id || !teacher_id || !class_name) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }
    const [result] = await pool.query(
      "INSERT INTO classes (course_id, teacher_id, class_name, start_date, end_date, max_students) VALUES (?, ?, ?, ?, ?, ?)",
      [course_id, teacher_id, class_name, start_date || null, end_date || null, max_students || 30]
    );
    const classId = result.insertId;

    if (schedules && schedules.length > 0) {
      const scheduleValues = schedules.map(s => [classId, s.day_of_week, s.start_time, s.end_time, s.room || null]);
      await pool.query(
        "INSERT INTO class_schedules (class_id, day_of_week, start_time, end_time, room) VALUES ?",
        [scheduleValues]
      );
    }
    res.status(201).json({ message: "Tạo lớp học thành công", classId });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
  }
};

export const updateClass = async (req, res) => {
  const { id } = req.params;
  const { course_id, teacher_id, class_name, start_date, end_date, max_students } = req.body;
  try {
    const [classes] = await pool.query("SELECT * FROM classes WHERE id = ?", [id]);
    if (classes.length === 0) return res.status(404).json({ message: "Không tìm thấy lớp học" });
    const cur = classes[0];

    await pool.query(
      "UPDATE classes SET course_id=?, teacher_id=?, class_name=?, start_date=?, end_date=?, max_students=? WHERE id=?",
      [
        course_id !== undefined ? course_id : cur.course_id,
        teacher_id !== undefined ? teacher_id : cur.teacher_id,
        class_name !== undefined ? class_name : cur.class_name,
        start_date !== undefined ? start_date : cur.start_date,
        end_date !== undefined ? end_date : cur.end_date,
        max_students !== undefined ? max_students : cur.max_students,
        id,
      ]
    );
    res.status(200).json({ message: "Cập nhật lớp học thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
  }
};

export const deleteClass = async (req, res) => {
  const { id } = req.params;
  try {
    const [check] = await pool.query("SELECT id FROM classes WHERE id = ?", [id]);
    if (check.length === 0) return res.status(404).json({ message: "Không tìm thấy lớp học" });
    await pool.query("DELETE FROM classes WHERE id = ?", [id]);
    res.status(200).json({ message: "Xóa lớp học thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
  }
};

export const addSchedule = async (req, res) => {
  const { id } = req.params;
  const { day_of_week, start_time, end_time, room } = req.body;
  try {
    await pool.query(
      "INSERT INTO class_schedules (class_id, day_of_week, start_time, end_time, room) VALUES (?, ?, ?, ?, ?)",
      [id, day_of_week, start_time, end_time, room || null]
    );
    res.status(201).json({ message: "Thêm lịch học thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
  }
};

export const getMySchedules = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT cs.*, cl.class_name, c.course_name
      FROM class_schedules cs
      JOIN classes cl ON cs.class_id = cl.id
      JOIN courses c ON cl.course_id = c.id
      JOIN enrollments e ON e.class_id = cl.id
      WHERE e.student_id = ? AND e.status = 'đã duyệt'
      ORDER BY FIELD(cs.day_of_week, 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'), cs.start_time
    `, [req.user.id]);
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
  }
};

export const deleteSchedule = async (req, res) => {
  const { scheduleId } = req.params;
  try {
    await pool.query("DELETE FROM class_schedules WHERE id = ?", [scheduleId]);
    res.status(200).json({ message: "Xóa lịch học thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
  }
};
