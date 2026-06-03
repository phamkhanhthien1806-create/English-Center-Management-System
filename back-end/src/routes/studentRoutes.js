import express from "express";
import { getStudents, getStudentById, updateStudentStatus } from "../controllers/studentController.js";
import { authenticateToken, authorizeRole } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", authenticateToken, authorizeRole(["quản trị viên"]), getStudents);
router.get("/:id", authenticateToken, authorizeRole(["quản trị viên"]), getStudentById);
router.put("/:id/status", authenticateToken, authorizeRole(["quản trị viên"]), updateStudentStatus);

export default router;
