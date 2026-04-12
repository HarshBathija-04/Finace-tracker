import notificationModel from "../models/Notification.js";

export const getNotification = async (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = await notificationModel.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json(notifications);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error fetching notifications" });
  }
}

export const updateNotification = async (req, res) => {
  try {
    await notificationModel.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Error updating notifications" });
  }
}

export const deleteNotification = async (req, res) => {
  try {
    await notificationModel.deleteMany({ userId: req.params.userId });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Error clearing notifications" });
  }
}