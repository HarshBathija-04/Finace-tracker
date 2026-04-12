import express from "express";
import { addTransaction, getTrasactions, updateTransaction, deleteTransaction, uploadReceipt, pauseRecurringTxn, resumeRecurringTxn, cancelRecurringTxn } from "../controllers/transactionController.js";
import { protect } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.post("/", protect, addTransaction);
router.get("/", protect, getTrasactions);
router.put("/:id", protect, updateTransaction);
router.delete("/:id", protect, deleteTransaction);

router.patch("/:id/recurring/pause", protect, pauseRecurringTxn);
router.patch("/:id/recurring/resume", protect, resumeRecurringTxn);
router.patch("/:id/recurring/cancel", protect, cancelRecurringTxn);

router.post("/upload-receipt", upload.single("receipt"), protect, uploadReceipt);

export default router;