import pool from "../config/db.js";

export const getMyNotifications = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC",
      [req.user.id]
    );
    const unreadCount = rows.filter(n => !n.is_read).length;
    res.status(200).json({ notifications: rows, unreadCount });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
  }
};

export const markAsRead = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(
      "UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?",
      [id, req.user.id]
    );
    res.status(200).json({ message: "Đã đánh dấu đã đọc" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    await pool.query(
      "UPDATE notifications SET is_read = TRUE WHERE user_id = ?",
      [req.user.id]
    );
    res.status(200).json({ message: "Đã đánh dấu tất cả là đã đọc" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
  }
};

export const sendNotification = async (req, res) => {
  const { user_id, title, message, broadcast } = req.body;
  try {
    if (!title || !message) return res.status(400).json({ message: "Thiếu tiêu đề hoặc nội dung" });

    if (broadcast) {
      // Gửi cho tất cả học viên
      const [students] = await pool.query("SELECT id FROM users WHERE role = 'học viên'");
      const values = students.map(s => [s.id, title, message]);
      if (values.length > 0) {
        await pool.query("INSERT INTO notifications (user_id, title, message) VALUES ?", [values]);
      }
      res.status(201).json({ message: `Đã gửi thông báo đến ${values.length} học viên` });
    } else {
      if (!user_id) return res.status(400).json({ message: "Thiếu user_id khi không broadcast" });
      await pool.query(
        "INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)",
        [user_id, title, message]
      );
      res.status(201).json({ message: "Đã gửi thông báo thành công" });
    }
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
  }
};
