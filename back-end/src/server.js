import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import pool from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Chào mừng đến với API Quản lý trung tâm tiếng Anh!");
});

app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Server đang chạy tại cổng ${port}`);
});

