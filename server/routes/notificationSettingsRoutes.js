import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { getNotificationSettings, updateNotificationSettings } from "../controllers/notificationSettings.js";

const router = express.Router();

router.get("/:userId", protect, getNotificationSettings);
router.put("/:userId", protect, updateNotificationSettings);

export default router;