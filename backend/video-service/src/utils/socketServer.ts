import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import dotenv from "dotenv"
dotenv.config();
export const initializeSocketServer = (httpServer: HttpServer) => {
  const origin_url=process.env.FRONT_END_URL
  const socketPath=process.env.SOCKET_PATH
  const io = new SocketServer(httpServer, {
    path: '/socket.io/',
    cors: {
      origin: origin_url, // Your frontend URL
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true
    }
  });


  return io;
};