import React, { createContext, useContext, useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { connectSocket, disconnectSocket } from "../../utils/functions/socket";
import { useAppSelector } from "../../utils/hooks/storeHooks";
import { RootState } from "../../utils/store/store";
import { SOCKET_EVENTS } from "../constants/socketEvents";

interface SocketContextValue {
  socket: Socket | null;
  joinVideo: (videoId: string) => void;
  leaveVideo: (videoId: string) => void;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  joinVideo: () => {},
  leaveVideo: () => {},
});

/** Access the single app-wide socket and the per-video room helpers. */
export const useSocket = () => useContext(SocketContext);

/**
 * Owns the one and only socket connection for the app. Individual hooks must
 * subscribe to events and join/leave rooms — they must never connect or
 * disconnect the socket themselves (that was the previous bug where each hook's
 * cleanup tore down the shared connection for the others).
 */
export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = useAppSelector((state: RootState) => state.auth.token);
  const hasToken = !!token;
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Connect once a session token exists. Depend on the boolean (not the token
    // value) so the 30s token refresh does not churn the connection.
    if (!hasToken) {
      setSocket(null);
      return;
    }

    const s = connectSocket(token as string);
    if (!s.connected) s.connect();
    setSocket(s);

    return () => {
      disconnectSocket();
      setSocket(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasToken]);

  const joinVideo = (videoId: string) => {
    if (videoId && socket) socket.emit(SOCKET_EVENTS.JOIN_VIDEO, videoId);
  };
  const leaveVideo = (videoId: string) => {
    if (videoId && socket) socket.emit(SOCKET_EVENTS.LEAVE_VIDEO, videoId);
  };

  return (
    <SocketContext.Provider value={{ socket, joinVideo, leaveVideo }}>
      {children}
    </SocketContext.Provider>
  );
};
