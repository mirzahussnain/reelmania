import { Server as SocketServer } from 'socket.io';

// Add this to your existing imports
let io: SocketServer;

export const setSocketInstance = (socketInstance: SocketServer) => {
  io = socketInstance;
};


