// socket.ts
import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL as string;
let socket: Socket | null = null;

const connectSocket = (token:string) => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      auth:token?{ token }:undefined,
    });
  }
  return socket;
};

const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
  }
};

export { connectSocket, disconnectSocket };