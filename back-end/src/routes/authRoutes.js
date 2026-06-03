import express from "express";
import { login, register, getProfile } from "../controllers/authController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

router.get("/profile", authenticateToken, getProfile);

export default router;
