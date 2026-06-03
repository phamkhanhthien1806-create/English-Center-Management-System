import express from "express";
import { getMyNotifications, markAsRead, markAllAsRead, sendNotification } from "../controllers/notificationController.js";
import { authenticateToken, authorizeRole } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", authenticateToken, getMyNotifications);
router.put("/read-all", authenticateToken, markAllAsRead);
router.put("/:id/read", authenticateToken, markAsRead);
router.post("/", authenticateToken, authorizeRole(["quản trị viên"]), sendNotification);

export default router;
