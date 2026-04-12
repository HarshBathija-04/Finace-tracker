import cron from "node-cron";
import { generateAiAlerts, generateDailyReminders } from "../services/alertService.js";
import { getIO } from "../utils/socket.js";

cron.schedule("0 9,15,21 * * *", async () => {
  const io = getIO();
  await generateAiAlerts(io);
}, {
  timezone: "Asia/Kolkata"
});

cron.schedule("0 21 * * *", async () => {
  const io = getIO();
  await generateDailyReminders(io);
}, {
  timezone: "Asia/Kolkata"
});