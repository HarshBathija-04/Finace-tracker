import { Router } from "express";
import { z } from "zod";
import { query } from "../db.js";
import { notFound } from "../lib/domain.js";
import { requireAuth } from "../middleware.js";

const toNotification = (r) => ({
  id: r.id,
  message: r.message,
  type: r.type,
  aiGenerated: r.ai_generated,
  isRead: r.is_read,
  createdAt: r.created_at,
});

export const notificationsRouter = Router();
notificationsRouter.use(requireAuth);

notificationsRouter.get("/", async (req, res) => {
  const { rows } = await query("SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50", [
    req.userId,
  ]);
  res.json({ items: rows.map(toNotification), unread: rows.filter((r) => !r.is_read).length });
});

notificationsRouter.patch("/:id/read", async (req, res) => {
  const { id } = z.object({ id: z.uuid() }).parse(req.params);
  const { rowCount } = await query("UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2", [
    id,
    req.userId,
  ]);
  if (!rowCount) throw notFound("Notification");
  res.status(204).end();
});

notificationsRouter.post("/read-all", async (req, res) => {
  await query("UPDATE notifications SET is_read = true WHERE user_id = $1 AND NOT is_read", [req.userId]);
  res.status(204).end();
});

notificationsRouter.delete("/", async (req, res) => {
  await query("DELETE FROM notifications WHERE user_id = $1", [req.userId]);
  res.status(204).end();
});
