import express from "express";
import { getTeachers, createTeacher, updateTeacher, deleteTeacher } from "../controllers/teacherController.js";
import { authenticateToken, authorizeRole } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", getTeachers);
router.post("/", authenticateToken, authorizeRole(["quản trị viên"]), createTeacher);
router.put("/:id", authenticateToken, authorizeRole(["quản trị viên"]), updateTeacher);
router.delete("/:id", authenticateToken, authorizeRole(["quản trị viên"]), deleteTeacher);

export default router;
