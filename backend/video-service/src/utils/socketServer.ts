import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import dotenv from "dotenv"
dotenv.config();
export const initializeSocketServer = (httpServer: HttpServer) => {
  const origin_url=process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',')
  : [];
  const io = new SocketServer(httpServer, {
    path: '/videosocket/',
    cors: {
      origin: origin_url, 
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true
    }
  });


  return io;
};