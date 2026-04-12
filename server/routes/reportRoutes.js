import express from "express";
import { getMonthlySummary, getSpendingTrend, getCategoryBreakdown, getIncomeVsExpense, getAiInsights } from "../controllers/reportController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/summary/:userId/:month/:year", protect, getMonthlySummary);
router.get("/trend/:userId/:month/:year", protect, getSpendingTrend);
router.get("/category-breakdown/:userId/:month/:year", protect, getCategoryBreakdown);
router.get("/income-vs-expense/:userId", protect, getIncomeVsExpense);
router.get("/ai-insights/:userId/:month/:year", protect, getAiInsights);

export default router;