/**
 * API response & request contracts — the single place that describes the shapes
 * the user-service and video-service actually return over the wire.
 *
 * Phase 8.1: instead of hand-mirroring Prisma models in `types.ts` and keeping
 * them in sync manually, the client derives its request/response types from
 * these envelopes. The domain DTOs (`VideoType`, `CommentType`, …) still live in
 * `types.ts`; this module wraps them in the per-endpoint envelopes RTK Query
 * consumes.
 *
 * NOTE: the two services do not share a single envelope yet — the payload lives
 * under `body` | `videos` | `result` | `data` depending on the endpoint. These
 * types capture that reality faithfully; unifying the wire envelope is a
 * backend follow-up (IMPLEMENTATION_PLAN 1.5), not a client concern.
 */
import type { VideoType, CommentType, VideoLikes, userType } from "../../types";

/** Fields any JSON response from either service may carry. */
export interface ApiBase {
  success?: boolean;
  message?: string;
  error?: string;
}

/* ------------------------------------------------------------------ *
 * video-service
 * ------------------------------------------------------------------ */

/** Query args for the explore/search feed (`GET /videos`). */
export interface FeedQueryArgs {
  cursor?: string;
  q?: string;
  type?: string;
  limit?: number;
}

/** Cursor-paginated list of videos (`getVideos`, `getUserVideos`, for-you feed). */
export interface VideoListResponse extends ApiBase {
  videos: VideoType[];
  nextCursor?: string | null;
  limit?: number;
}

/** Single video lookup (`getVideoById`). `videos: null` is the "not found" shape. */
export interface VideoByIdResponse extends ApiBase {
  video?: VideoType | null;
  videos?: null;
}

/** Cursor-paginated comments (`getCommentsByVideoId`). */
export interface CommentListResponse extends ApiBase {
  comments: CommentType[];
  nextCursor: string | null;
}

/** Cursor-paginated likes (`getLikesByVideoId`). */
export interface LikeListResponse extends ApiBase {
  likes: VideoLikes[];
  nextCursor: string | null;
}

/** Result of posting a comment (`addNewComment`). */
export interface AddCommentResponse extends ApiBase {
  videoId: string;
  newComments: CommentType;
  newVideos: VideoType;
  commentsCount: number;
}

/** Result of toggling a like (`updateLikes`). */
export interface UpdateLikesResponse extends ApiBase {
  videoId: string;
  updatedLikes: VideoLikes[];
}

/** Pre-signed upload URL (`generateUploadUrl`). */
export interface GenerateUploadUrlResponse {
  signedUrl: string;
  fileName: string;
}

/** Metadata persisted alongside a freshly uploaded file. */
export interface UploadVideoMetadata {
  title: string;
  hashtags: string[];
  uploaded_by: { id: string; username: string };
  uploaded_at: Date;
}

/** Result of persisting video metadata (`createVideo`). */
export interface CreateVideoResponse extends ApiBase {
  video: VideoType;
}

/** Generic message-only response (delete, SAS, etc.). */
export interface MessageResponse extends ApiBase {
  signedUrl?: string;
}

/* ------------------------------------------------------------------ *
 * user-service
 * ------------------------------------------------------------------ */

/** Single user profile (`getUserProfile`, `getMyProfile`, `getUserByUsername`). */
export interface UserProfileResponse extends ApiBase {
  body: userType | null;
}

/** Paginated list of users (`getUsers`). */
export interface UsersListResponse extends ApiBase {
  users: userType[];
  page: number;
  limit: number;
}

/** The user attached to a follower edge (selected projection). */
export interface FollowerNode {
  id: string;
  username: string;
  avatar_url: string;
  first_name: string;
  last_name: string;
}

/** A follower relationship row, including the following user's details. */
export interface FollowerEdge {
  follower_id: string;
  following_id: string;
  created_at: string;
  users_followers_follower_idTousers: FollowerNode | null;
}

/** Paginated followers list (`getFollowers`). */
export interface FollowersResponse extends ApiBase {
  result: FollowerEdge[];
  page: number;
  limit: number;
  total: number;
}

/** O(1) follow-status check (`checkFollower`). */
export interface CheckFollowerResponse extends ApiBase {
  isFollowing: boolean;
}

/** Follow/unfollow toggle (`updateFollower`). */
export interface FollowMutationResponse extends ApiBase {
  result: FollowerEdge | null;
}

/** Role update (`updateUserRole`). */
export interface UpdateRoleResponse extends ApiBase {
  data?: userType;
}
