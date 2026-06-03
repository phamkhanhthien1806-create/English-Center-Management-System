import express from "express";
import { getOverview, getRevenue, getStudentsPerCourse, getAvgScores } from "../controllers/statsController.js";
import { authenticateToken, authorizeRole } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/overview", authenticateToken, authorizeRole(["quản trị viên"]), getOverview);
router.get("/revenue", authenticateToken, authorizeRole(["quản trị viên"]), getRevenue);
router.get("/students-per-course", authenticateToken, authorizeRole(["quản trị viên"]), getStudentsPerCourse);
router.get("/avg-scores", authenticateToken, authorizeRole(["quản trị viên"]), getAvgScores);

export default router;
