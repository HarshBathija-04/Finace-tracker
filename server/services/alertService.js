import transactionModel from "../models/Transaction.js";
import budgetModel from "../models/Budget.js";
import notificationModel from "../models/Notification.js";
import userModel from "../models/User.js";
import { askGemini } from "./gemini.js";
import { createNotification } from "./notificationService.js";
import notificationSettingsModel from "../models/NotificationSettings.js";
import mongoose from "mongoose";


export const generateAiAlerts = async () => {
  try {
    const users = await mongoose.model("User").find();

    for(let user of users) {
      const settings = await notificationSettingsModel.findOne({ userId: user._id });
      if(!settings || !settings.aiInsights?.enabled) continue;

      const now = new Date();
      if(settings.aiInsights.frequency === "weekly") {
        if(now.getDay() !== 1 || now.getHours() !== 9) continue;
      }

      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

      const transaction = await transactionModel.find({
        userId: user._id, date: { $gte: startOfMonth, $lt: new Date() },
      });

      const totalExpense = transaction
        .filter(t => t.type === "expense")
        .reduce((a, t) => a + t.amount, 0);

      const totalIncome = transaction
        .filter(t => t.type === "income")
        .reduce((a, t) => a + t.amount, 0);

      const budget = await budgetModel.findOne({
        userId: user._id,
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
      });

      const aiPrompt = `
        You are a personal finance assistant.
        Based on this user's current data:
         - Total Income this month: ${totalIncome}
         - Total Expense this month: ${totalExpense}
         - Budget: ${budget ? JSON.stringify(budget.categoryBudgets) : "No Budget set"}

        Generate 2 - 3 short alerts (max 1 sentence each).
        Format: Each alert on a new line, prefixed with one of these tags:
        [budget], [spending], [income], [general].
      `;

      const aiResponse = await askGemini(aiPrompt);

      const alerts = aiResponse
        .split("\n")
        .map(a => a.trim())
        .filter(a => a.length > 0);

        
      for(let msg of alerts) {
        let type = "general";
        if(msg.startsWith("[budget]")) type = "budget";
        else if (msg.startsWith("[spending]")) type = "spending";
        else if (msg.startsWith("[income]")) type = "income";

        const cleanMsg = msg.replace(/\[(budget|spending|income|general)\]/i, "").trim();
        
        await createNotification(user._id, cleanMsg, type, true);
      }
    }
  } catch (error) {
    console.log("AI alert generation failed: ", error);
  }
};

export const generateDailyReminders = async (io) => {
  try {
    const users = await userModel.find({});

    for(const user of users) {
      const firstName = user.name?.split(" ")[0] || "there";
      const message = `Hey ${firstName}, don't forget to log your expenses today to stay on track with your budgets!`;

      const notification = await notificationModel.create({
        userId: user._id, message,
      });

      io.to(user._id.toString()).emit("newNotification", notification);
    }
  } catch (error) {
    console.log("Error generating daily reminders: ", error);
  }
};