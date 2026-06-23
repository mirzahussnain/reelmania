/**
 * Realtime event contract (client side).
 * Keep this in sync with the video-service's `src/constants/socketEvents.ts`.
 */
import type { CommentType, VideoLikes } from "../../types";

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

/** Payload broadcast on `COMMENT_ADDED`. */
export interface CommentAddedPayload {
  videoId: string;
  newComment: CommentType;
  commentCount?: number;
}

/** Payload broadcast on `LIKES_CHANGED`. */
export interface LikesChangedPayload {
  videoId: string;
  updatedLikes: VideoLikes[];
}
