// socketController.ts
import { Server as SocketServer } from 'socket.io';

let io: SocketServer;

export const setSocketInstance = (socketInstance: SocketServer) => {
  io = socketInstance;
  
  io.on('connection', (socket) => {
    socket.on('newComment', ({videoId, newComment,newVideo,commentCount}) => {
      io.emit('newCommentAdded', {videoId, newComment,newVideo,commentCount});
    });
    socket.on('likeUpdated',({updatedLikes,videoId})=>{
        io.emit('likesChange', {updatedLikes,videoId});
    })

    io.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
};