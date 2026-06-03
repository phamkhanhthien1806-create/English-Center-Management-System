import express from "express";
import {
  getCourses,
  getCourseById,
  getCategories,
  createCourse,
  updateCourse,
  deleteCourse,
} from "../controllers/courseController.js";
import { authenticateToken, authorizeRole } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", getCourses);
router.get("/categories", getCategories);
router.get("/:id", getCourseById);

router.post("/", authenticateToken, authorizeRole(["quản trị viên"]), createCourse);
router.put("/:id", authenticateToken, authorizeRole(["quản trị viên"]), updateCourse);
router.delete("/:id", authenticateToken, authorizeRole(["quản trị viên"]), deleteCourse);

export default router;
