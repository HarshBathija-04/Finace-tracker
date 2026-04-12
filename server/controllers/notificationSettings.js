import notificationSettingsModel from "../models/NotificationSettings.js";

export const getNotificationSettings = async (req, res) => {
  try {
    const { userId } = req.params;
    let settings = await notificationSettingsModel.findOne({ userId });

    if(!settings) {
      settings = new notificationSettingsModel({
        userId,
        budgetAlerts: true,
        aiInsights: { enabled: true, frequency: "daily" },
        reminders: true,
      });
      await settings.save();
    }

    res.status(200).json(settings);
  } catch (error) {
    console.log("Error fetching notifications settings: ", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const updateNotificationSettings = async (req, res) => {
  try {
    const { userId } = req.params;
    const { budgetAlerts, aiInsights, reminders } = req.body;

    const updatedSettings = await notificationSettingsModel.findOneAndUpdate(
      { userId },
      { budgetAlerts, aiInsights, reminders },
      { new: true, upsert: true },
    );

    res.status(200).json(updatedSettings);
  } catch (error) {
    console.log("Error updating notification settings:", error);
    res.status(500).json({ message: "Error updating settings" });
  }
};