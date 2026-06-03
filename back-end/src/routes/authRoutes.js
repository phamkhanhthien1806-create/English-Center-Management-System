import express from "express";
import { login, register, getProfile, updateProfile } from "../controllers/authController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import { uploadAvatar } from "../middlewares/upload.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/profile", authenticateToken, getProfile);
router.put("/profile", authenticateToken, uploadAvatar.single("avatar"), updateProfile);

export default router;
