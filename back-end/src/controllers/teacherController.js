import pool from "../config/db.js";

export const getTeachers = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM teachers ORDER BY full_name");
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
  }
};

export const createTeacher = async (req, res) => {
  const { full_name, email, phone, specialization } = req.body;
  try {
    if (!full_name || !email || !phone) return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    const [result] = await pool.query(
      "INSERT INTO teachers (full_name, email, phone, specialization) VALUES (?, ?, ?, ?)",
      [full_name, email, phone, specialization || null]
    );
    res.status(201).json({ message: "Thêm giáo viên thành công", teacherId: result.insertId });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") return res.status(400).json({ message: "Email hoặc SĐT đã tồn tại" });
    res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
  }
};

export const updateTeacher = async (req, res) => {
  const { id } = req.params;
  const { full_name, email, phone, specialization } = req.body;
  try {
    const [teachers] = await pool.query("SELECT * FROM teachers WHERE id = ?", [id]);
    if (teachers.length === 0) return res.status(404).json({ message: "Không tìm thấy giáo viên" });
    const cur = teachers[0];

    await pool.query(
      "UPDATE teachers SET full_name=?, email=?, phone=?, specialization=? WHERE id=?",
      [
        full_name !== undefined ? full_name : cur.full_name,
        email !== undefined ? email : cur.email,
        phone !== undefined ? phone : cur.phone,
        specialization !== undefined ? specialization : cur.specialization,
        id,
      ]
    );
    res.status(200).json({ message: "Cập nhật giáo viên thành công" });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") return res.status(400).json({ message: "Email hoặc SĐT đã tồn tại" });
    res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
  }
};

export const deleteTeacher = async (req, res) => {
  const { id } = req.params;
  try {
    const [check] = await pool.query("SELECT id FROM teachers WHERE id = ?", [id]);
    if (check.length === 0) return res.status(404).json({ message: "Không tìm thấy giáo viên" });
    await pool.query("DELETE FROM teachers WHERE id = ?", [id]);
    res.status(200).json({ message: "Xóa giáo viên thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
  }
};
