/**
 * Realtime event contract (video-service side).
 * Keep this in sync with the client's `shared/constants/socketEvents.ts`.
 */
export const SOCKET_EVENTS = {
  // client -> server
  JOIN_VIDEO: "joinVideo",
  LEAVE_VIDEO: "leaveVideo",
  NEW_COMMENT: "newComment",
  LIKE_UPDATED: "likeUpdated",
  // server -> client
  COMMENT_ADDED: "newCommentAdded",
  LIKES_CHANGED: "likesChange",
} as const;
