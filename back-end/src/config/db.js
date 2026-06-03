import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "english_center_management",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

(async () => {
  try {
    const connection = await pool.getConnection();
    console.log("Kết nối cơ sở dữ liệu MySQL thành công!");
    connection.release();
  } catch (error) {
    console.error("Lỗi kết nối cơ sở dữ liệu MySQL:", error.message);
  }
})();

export default pool;
