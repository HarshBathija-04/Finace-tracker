import express from "express";
import { getNotification, updateNotification, deleteNotification } from "../controllers/notificationController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/:userId", protect, getNotification);
router.put("/mark-read/:id", protect, updateNotification);
router.delete("/clear/:userId", protect, deleteNotification);

export default router;