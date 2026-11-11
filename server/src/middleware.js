import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { ZodError } from "zod";
import multer from "multer";
import { config } from "./config.js";
import { HttpError } from "./lib/domain.js";

export function requireAuth(req, _res, next) {
  const [scheme, token] = (req.headers.authorization || "").split(" ");
  if (scheme !== "Bearer" || !token) return next(new HttpError(401, "Authentication required", "UNAUTHORIZED"));
  try {
    const payload = jwt.verify(token, config.jwtSecret, { algorithms: ["HS256"] });
    req.userId = payload.sub;
    next();
  } catch {
    next(new HttpError(401, "Session expired, please sign in again", "UNAUTHORIZED"));
  }
}

const limitHandler = (_req, _res, next) =>
  next(new HttpError(429, "Too many requests, please slow down", "RATE_LIMITED"));

export const authLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 20, handler: limitHandler });
export const aiLimiter = rateLimit({
  windowMs: 10 * 60_000,
  limit: 15,
  keyGenerator: (req) => req.userId,
  handler: limitHandler,
});

export const receiptUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) =>
    ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)
      ? cb(null, true)
      : cb(new HttpError(415, "Upload a JPEG, PNG or WebP image", "UNSUPPORTED_MEDIA")),
}).single("receipt");

export function notFoundHandler(_req, _res, next) {
  next(new HttpError(404, "Route not found", "NOT_FOUND"));
}

export function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: err.issues[0]?.message || "Invalid input",
        details: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      },
    });
  }
  if (err instanceof HttpError) return res.status(err.status).json({ error: { code: err.code, message: err.message } });
  if (err instanceof multer.MulterError) {
    const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    return res
      .status(status)
      .json({ error: { code: err.code, message: status === 413 ? "Image must be under 4 MB" : err.message } });
  }
  if (err.type === "entity.parse.failed" || err.type === "entity.too.large") {
    return res.status(err.status || 400).json({ error: { code: "BAD_REQUEST", message: "Malformed request body" } });
  }
  console.error(err);
  res.status(500).json({ error: { code: "INTERNAL", message: "Something went wrong" } });
}
