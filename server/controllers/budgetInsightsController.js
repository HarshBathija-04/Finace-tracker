import transactionModel from "../models/Transaction.js";
import budgetModel from "../models/Budget.js";
import { budgetInsights } from "../services/gemini.js";
import Notification from "../models/Notification.js";

export const getBudgetInsights = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, month, year } = req.query;

    let start, end;

    if(startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else if(month && year) {
      start = new Date(year, month - 1, 1);
      end = new Date(year, month, 0);
    } else {
      start = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      end = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
    }

    const transaction = await transactionModel.find({
      userId: userId,
      date: { $gte: start, $lte: end },
    });

    const budget = await budgetModel.findOne({ 
      userId: userId,
      month: (month ? Number(month) : new Date().getMonth() + 1),
      year: (year ? Number(year) : new Date().getFullYear()),
    });

    if(!budget) {
      return res.status(400).json({ message: "No budget set for this user" });
    }

    const insights = await budgetInsights(userId, transaction, budget);

    if(insights.warnings && insights.warnings.length > 0) {
      await Promise.all(
        insights.warnings.map(async (warning) => {
          await Notification.create({
            userId, type: "budget", message: warning
          });
        })
      );
    }

    res.status(200).json({ success: true, range: { start, end }, insights });
  } catch (error) {
    console.log("Error fetching budget insights: ", error);
    res.status(500).json({ message: "Error fetching budget insights" });
  }
};