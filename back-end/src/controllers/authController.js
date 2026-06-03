import pool from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key";

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ email và mật khẩu" });
    }

    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: "Email hoặc mật khẩu không chính xác" });
    }

    const user = rows[0];

    if (user.status === "bị khóa") {
      return res.status(403).json({ message: "Tài khoản của bạn đã bị khóa" });
    }

    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, user.password);
    } catch (err) {
      const compatPassword = user.password.replace(/^\$2y\$/, "$2a$");
      isMatch = await bcrypt.compare(password, compatPassword);
    }

    if (!isMatch) {
      return res.status(401).json({ message: "Email hoặc mật khẩu không chính xác" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      message: "Đăng nhập thành công",
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    res.status(500).json({ message: "Đã xảy ra lỗi hệ thống", error: error.message });
  }
};

export const register = async (req, res) => {
  const { full_name, email, password, phone, role } = req.body;

  try {
    if (!full_name || !email || !password || !phone) {
      return res.status(400).json({ message: "Vui lòng điền đầy đủ các thông tin bắt buộc" });
    }

    const [existingEmail] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existingEmail.length > 0) {
      return res.status(400).json({ message: "Email này đã được sử dụng" });
    }

    const [existingPhone] = await pool.query("SELECT id FROM users WHERE phone = ?", [phone]);
    if (existingPhone.length > 0) {
      return res.status(400).json({ message: "Số điện thoại này đã được sử dụng" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const finalRole = role === "quản trị viên" ? "quản trị viên" : "học viên";

    const [result] = await pool.query(
      "INSERT INTO users (full_name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)",
      [full_name, email, hashedPassword, phone, finalRole]
    );

    const newUserId = result.insertId;

    if (finalRole === "học viên") {
      await pool.query(
        "INSERT INTO student_profiles (user_id, birthday, gender, address, avatar) VALUES (?, NULL, NULL, NULL, NULL)",
        [newUserId]
      );
    }

    res.status(201).json({
      message: "Đăng ký tài khoản thành công",
      userId: newUserId,
    });
  } catch (error) {
    console.error("Lỗi đăng ký:", error);
    res.status(500).json({ message: "Đã xảy ra lỗi hệ thống", error: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const [userRows] = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.phone, u.role, u.status, u.created_at,
              sp.birthday, sp.gender, sp.address, sp.avatar
       FROM users u
       LEFT JOIN student_profiles sp ON u.id = sp.user_id
       WHERE u.id = ?`,
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    res.status(200).json({ user: userRows[0] });
  } catch (error) {
    console.error("Lỗi lấy thông tin cá nhân:", error);
    res.status(500).json({ message: "Đã xảy ra lỗi hệ thống", error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  const userId = req.user.id;
  const { full_name, phone, birthday, gender, address } = req.body;
  try {
    // Cập nhật bảng users
    if (full_name || phone) {
      const updates = [];
      const params = [];
      if (full_name) { updates.push("full_name = ?"); params.push(full_name); }
      if (phone) { updates.push("phone = ?"); params.push(phone); }
      params.push(userId);
      await pool.query(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, params);
    }

    // Cập nhật avatar nếu có upload
    let avatarPath = null;
    if (req.file) {
      avatarPath = `/uploads/avatars/${req.file.filename}`;
    }

    // Cập nhật student_profiles (chỉ với học viên)
    if (req.user.role === "học viên") {
      const [existing] = await pool.query("SELECT id FROM student_profiles WHERE user_id = ?", [userId]);
      if (existing.length > 0) {
        const fields = [];
        const vals = [];
        if (birthday !== undefined) { fields.push("birthday = ?"); vals.push(birthday || null); }
        if (gender !== undefined) { fields.push("gender = ?"); vals.push(gender || null); }
        if (address !== undefined) { fields.push("address = ?"); vals.push(address || null); }
        if (avatarPath) { fields.push("avatar = ?"); vals.push(avatarPath); }
        if (fields.length > 0) {
          vals.push(userId);
          await pool.query(`UPDATE student_profiles SET ${fields.join(", ")} WHERE user_id = ?`, vals);
        }
      }
    }

    // Trả về profile mới
    const [updated] = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.phone, u.role, u.status, u.created_at,
              sp.birthday, sp.gender, sp.address, sp.avatar
       FROM users u LEFT JOIN student_profiles sp ON u.id = sp.user_id WHERE u.id = ?`,
      [userId]
    );

    res.status(200).json({ message: "Cập nhật thông tin thành công", user: updated[0] });
  } catch (error) {
    console.error("Lỗi cập nhật hồ sơ:", error);
    res.status(500).json({ message: "Đã xảy ra lỗi hệ thống", error: error.message });
  }
};
