import mongoose from "mongoose";

const notificationSettingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  budgetAlerts: { type: Boolean, default: true },
  aiInsights: {
    enabled: { type: Boolean, default: true },
    frequency: { type: String, enum: ["daily", "weekly"], default: "daily" },
  },
  reminders: { type: Boolean, default: true },
}, { timestamps: true });

const notificationSettingsModel = mongoose.model("NotificationSettings", notificationSettingsSchema);

export default notificationSettingsModel;