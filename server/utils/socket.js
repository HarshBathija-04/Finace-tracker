import { Server } from "socket.io";
import { protectSocket } from "../middlewares/authMiddleware.js";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: { 
      origin: "https://finsight-et.netlify.app", 
      methods: ["GET", "POST"] ,
      credentials: true,
    }
  });
  
  // io.use(protectSocket);

  io.on("connection", (socket) => {
    console.log("New client connected: ", socket.id);
    socket.emit("welcome", { message: "Welcome to finance tracker websocket!" });

    socket.on("register", (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined room`);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected: ", socket.id);
    });
  });
  return io;
};

export const getIO = () => io;