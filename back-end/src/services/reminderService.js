import pool from "../config/db.js";

const getVietnameseDayOfWeek = () => {
  const days = [
    "Chủ Nhật",
    "Thứ Hai",
    "Thứ Ba",
    "Thứ Tư",
    "Thứ Năm",
    "Thứ Sáu",
    "Thứ Bảy"
  ];
  return days[new Date().getDay()];
};

export const checkAndSendReminders = async () => {
  try {
    const now = new Date();
    const targetTime = new Date(now.getTime() + 30 * 60 * 1000);
    const hours = String(targetTime.getHours()).padStart(2, "0");
    const minutes = String(targetTime.getMinutes()).padStart(2, "0");
    const targetTimeString = `${hours}:${minutes}`;

    const dayOfWeek = getVietnameseDayOfWeek();

    const [rows] = await pool.query(
      `SELECT cs.class_id, cs.start_time, cl.class_name, e.student_id
       FROM class_schedules cs
       JOIN classes cl ON cs.class_id = cl.id
       JOIN enrollments e ON e.class_id = cl.id
       WHERE cs.day_of_week = ? 
         AND TIME_FORMAT(cs.start_time, '%H:%i') = ?
         AND e.status = 'đã duyệt'`,
      [dayOfWeek, targetTimeString]
    );

    if (rows.length === 0) return;

    const values = rows.map(r => {
      const timeStr = typeof r.start_time === "string" ? r.start_time.substring(0, 5) : String(r.start_time);
      const title = "Nhắc nhở lịch học";
      const message = `Lớp học ${r.class_name} của bạn sẽ bắt đầu lúc ${timeStr} (sau 30 phút nữa).`;
      return [r.student_id, title, message];
    });

    await pool.query(
      "INSERT INTO notifications (user_id, title, message) VALUES ?",
      [values]
    );
  } catch (error) {
    console.error("Lỗi khi quét lịch học:", error.message);
  }
};

export const startReminderService = () => {
  setInterval(checkAndSendReminders, 60000);
};
