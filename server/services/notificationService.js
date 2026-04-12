import notificationModel from "../models/Notification.js";
import { getIO } from "../utils/socket.js";

export const createNotification = async (userId, message, type="general", aiGenerated=false) => {
  const existing = await notificationModel.findOne({
    userId,
    message,
    type,
    aiGenerated,
  });

  if (existing) {
    return existing;
  }
  
  const notification = await notificationModel.create({
    userId, message, type, aiGenerated,
  });

  const io = getIO();
  if(io) {
    io.to(userId.toString()).emit("newNotification", notification);
  }

  return notification;
};
