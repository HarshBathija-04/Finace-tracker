import { io } from "socket.io-client";

let socket;

export const initSocket = (token) => {
  if (!socket) {
    socket = io("https://finsight-xxio.onrender.com/", {
      withCredentials: true,
      auth: { token },
    });
  }
  return socket;
};

export const getSocket = () => socket;
