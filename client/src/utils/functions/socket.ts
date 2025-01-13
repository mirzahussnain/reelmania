// socket.ts
import { io, Socket } from "socket.io-client";


let socket: Socket | null = null;

const connectSocket = (token:string) => {
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL as string;
  
  if (!socket) {
    
    socket = io(SOCKET_URL, {
      path:'/videosocket/',
      autoConnect: false,
      auth:token?{ token }:undefined,
      transports:["websocket","polling"],
      withCredentials:true
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