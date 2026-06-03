import express from "express";
import { getClasses, getClassById, createClass, updateClass, deleteClass, addSchedule } from "../controllers/classController.js";
import { authenticateToken, authorizeRole } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", getClasses);
router.get("/:id", getClassById);
router.post("/", authenticateToken, authorizeRole(["quản trị viên"]), createClass);
router.put("/:id", authenticateToken, authorizeRole(["quản trị viên"]), updateClass);
router.delete("/:id", authenticateToken, authorizeRole(["quản trị viên"]), deleteClass);
router.post("/:id/schedules", authenticateToken, authorizeRole(["quản trị viên"]), addSchedule);

export default router;
