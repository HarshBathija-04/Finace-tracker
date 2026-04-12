import jwt from "jsonwebtoken";
import userModel from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    let token = req.headers.authorization;
    if(!token) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }

    token = token.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await userModel.findById(decoded.id).select("-password");

    if(!user) {
      return res.status(401).json({ message: "User not found." });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Access denied. Invalid token." });
  }
};

export const protectSocket = async (socket, next) => {
  try {
    let token =
      socket.handshake.auth?.token ||
      (socket.handshake.headers?.authorization &&
        socket.handshake.headers.authorization.startsWith("Bearer ")
        ? socket.handshake.headers.authorization.split(" ")[1]
        : null);

    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.id).select("-password");

    if (!user) {
      return next(new Error("Authentication error: User not found"));
    }

    socket.user = user;
    next();
  } catch (err) {
    console.error("Socket auth failed:", err.message);
    next(new Error("Authentication error: Invalid or expired token"));
  }
};