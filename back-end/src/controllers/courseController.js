import pool from "../config/db.js";

export const getCourses = async (req, res) => {
  try {
    const [courses] = await pool.query(`
      SELECT c.*, cc.category_name 
      FROM courses c 
      JOIN course_categories cc ON c.category_id = cc.id
      ORDER BY c.created_at DESC
    `);
    res.status(200).json(courses);
  } catch (error) {
    console.error("Lỗi lấy danh sách khóa học:", error);
    res.status(500).json({ message: "Đã xảy ra lỗi hệ thống", error: error.message });
  }
};

export const getCourseById = async (req, res) => {
  const { id } = req.params;
  try {
    const [courses] = await pool.query(`
      SELECT c.*, cc.category_name 
      FROM courses c 
      JOIN course_categories cc ON c.category_id = cc.id
      WHERE c.id = ?
    `, [id]);

    if (courses.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy khóa học" });
    }

    const [classes] = await pool.query(`
      SELECT cl.*, t.full_name as teacher_name 
      FROM classes cl
      JOIN teachers t ON cl.teacher_id = t.id
      WHERE cl.course_id = ?
    `, [id]);

    res.status(200).json({
      course: courses[0],
      classes,
    });
  } catch (error) {
    console.error("Lỗi lấy chi tiết khóa học:", error);
    res.status(500).json({ message: "Đã xảy ra lỗi hệ thống", error: error.message });
  }
};

export const getCategories = async (req, res) => {
  try {
    const [categories] = await pool.query("SELECT * FROM course_categories");
    res.status(200).json(categories);
  } catch (error) {
    console.error("Lỗi lấy danh mục khóa học:", error);
    res.status(500).json({ message: "Đã xảy ra lỗi hệ thống", error: error.message });
  }
};

export const createCourse = async (req, res) => {
  const { category_id, course_name, level, tuition_fee, duration, description } = req.body;

  try {
    if (!category_id || !course_name || !tuition_fee) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ category_id, tên khóa học và học phí" });
    }

    const [result] = await pool.query(
      "INSERT INTO courses (category_id, course_name, level, tuition_fee, duration, description) VALUES (?, ?, ?, ?, ?, ?)",
      [category_id, course_name, level, tuition_fee, duration, description]
    );

    res.status(201).json({
      message: "Tạo khóa học thành công",
      courseId: result.insertId,
    });
  } catch (error) {
    console.error("Lỗi tạo khóa học:", error);
    res.status(500).json({ message: "Đã xảy ra lỗi hệ thống", error: error.message });
  }
};

export const updateCourse = async (req, res) => {
  const { id } = req.params;
  const { category_id, course_name, level, tuition_fee, duration, description } = req.body;

  try {
    const [courses] = await pool.query("SELECT * FROM courses WHERE id = ?", [id]);
    if (courses.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy khóa học để cập nhật" });
    }
    const cur = courses[0];

    await pool.query(
      `UPDATE courses 
       SET category_id = ?, course_name = ?, level = ?, tuition_fee = ?, duration = ?, description = ? 
       WHERE id = ?`,
      [
        category_id !== undefined ? category_id : cur.category_id,
        course_name !== undefined ? course_name : cur.course_name,
        level !== undefined ? level : cur.level,
        tuition_fee !== undefined ? tuition_fee : cur.tuition_fee,
        duration !== undefined ? duration : cur.duration,
        description !== undefined ? description : cur.description,
        id,
      ]
    );

    res.status(200).json({ message: "Cập nhật khóa học thành công" });
  } catch (error) {
    console.error("Lỗi cập nhật khóa học:", error);
    res.status(500).json({ message: "Đã xảy ra lỗi hệ thống", error: error.message });
  }
};

export const deleteCourse = async (req, res) => {
  const { id } = req.params;
  try {
    const [courseCheck] = await pool.query("SELECT id FROM courses WHERE id = ?", [id]);
    if (courseCheck.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy khóa học để xóa" });
    }

    await pool.query("DELETE FROM courses WHERE id = ?", [id]);
    res.status(200).json({ message: "Xóa khóa học thành công" });
  } catch (error) {
    console.error("Lỗi xóa khóa học:", error);
    res.status(500).json({ message: "Đã xảy ra lỗi hệ thống", error: error.message });
  }
};
