// socketController.ts
import { Server as SocketServer } from 'socket.io';
import { SOCKET_EVENTS } from '../constants/socketEvents';

let io: SocketServer;

export const setSocketInstance = (socketInstance: SocketServer) => {
  io = socketInstance;

  io.on('connection', (socket) => {
    // Clients join a per-video room so realtime events are only delivered to
    // viewers of that video instead of broadcast to every connected client.
    socket.on(SOCKET_EVENTS.JOIN_VIDEO, (videoId: string) => {
      if (videoId) socket.join(videoId);
    });

    socket.on(SOCKET_EVENTS.LEAVE_VIDEO, (videoId: string) => {
      if (videoId) socket.leave(videoId);
    });

    socket.on(SOCKET_EVENTS.NEW_COMMENT, ({ videoId, newComment, newVideo, commentCount }) => {
      // Emit to everyone in the room except the sender.
      socket.to(videoId).emit(SOCKET_EVENTS.COMMENT_ADDED, { videoId, newComment, newVideo, commentCount });
    });

    socket.on(SOCKET_EVENTS.LIKE_UPDATED, ({ updatedLikes, videoId }) => {
      socket.to(videoId).emit(SOCKET_EVENTS.LIKES_CHANGED, { updatedLikes, videoId });
    });

    // NOTE: bug fix — this was previously `io.on('disconnect')`, which
    // registered a new global listener on every connection (a leak).
    socket.on('disconnect', () => {
      // no-op; socket.io auto-cleans room membership on disconnect.
    });
  });
};
