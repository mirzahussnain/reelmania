/**
 * API response & request contracts — the single place that describes the shapes
 * the user-service and video-service return over the wire.
 *
 * Both services now share ONE envelope (IMPLEMENTATION_PLAN 1.5):
 *
 *   { success, message, data, meta? }
 *
 * `data` carries the payload (an entity, a list, or `null`); list endpoints put
 * pagination under `meta`. Client types are derived from this envelope rather
 * than hand-mirrored against Prisma — see `types.ts` for the domain DTOs.
 */
import type { VideoType, CommentType, VideoLikes, userType } from "../../types";

/** Pagination / list metadata returned alongside list endpoints. */
export interface ApiMeta {
  nextCursor?: string | null;
  page?: number;
  limit?: number;
  total?: number;
}

/** The single response envelope every endpoint returns. */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: ApiMeta;
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

/** Cursor-paginated list of videos (explore, for-you, per-user). */
export type VideoListResponse = ApiResponse<VideoType[]>;

/** Single video lookup. */
export type VideoByIdResponse = ApiResponse<VideoType>;

/** Cursor-paginated comments. */
export type CommentListResponse = ApiResponse<CommentType[]>;

/** Cursor-paginated likes. */
export type LikeListResponse = ApiResponse<VideoLikes[]>;

/** Result of posting a comment. */
export type AddCommentResponse = ApiResponse<{
  videoId: string;
  comment: CommentType;
  commentCount: number;
}>;

/** Result of toggling a like. */
export type UpdateLikesResponse = ApiResponse<{
  videoId: string;
  updatedLikes: VideoLikes[];
}>;

/** Pre-signed upload URL (+ the public URL the file resolves to post-upload). */
export type GenerateUploadUrlResponse = ApiResponse<{
  signedUrl: string;
  fileName: string;
  publicUrl: string;
}>;

/** Metadata persisted alongside a freshly uploaded file. */
export interface UploadVideoMetadata {
  title: string;
  hashtags: string[];
  uploaded_by: { id: string; username: string };
  uploaded_at: Date;
}

/** Result of persisting video metadata. */
export type CreateVideoResponse = ApiResponse<VideoType>;

/** Generic message-only / no-content response (delete, SAS, etc.). */
export type MessageResponse = ApiResponse<null>;

/* ------------------------------------------------------------------ *
 * user-service
 * ------------------------------------------------------------------ */

/** Single user profile (`getUserProfile`, `getMyProfile`, `getUserByUsername`). */
export type UserProfileResponse = ApiResponse<userType>;

/** Paginated list of users (`getUsers`). */
export type UsersListResponse = ApiResponse<userType[]>;

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
export type FollowersResponse = ApiResponse<FollowerEdge[]>;

/** O(1) follow-status check (`checkFollower`). */
export type CheckFollowerResponse = ApiResponse<{ isFollowing: boolean }>;

/** Follow/unfollow toggle (`updateFollower`). */
export type FollowMutationResponse = ApiResponse<FollowerEdge | null>;

/** Role update (`updateUserRole`). */
export type UpdateRoleResponse = ApiResponse<userType>;

/* ------------------------------------------------------------------ *
 * curation-service
 * ------------------------------------------------------------------ */

/** A user-owned collection (the "Vault"). Cross-service refs are soft ids. */
export interface CollectionEntity {
  id: string;
  ownerId: string;
  title: string;
  slug: string;
  description: string | null;
  coverImageUrl: string | null;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

/** A collection in a LIST: counts + first-few hydrated videos for the mosaic.
 * `containsVideo` is present only when listed with `?containsVideoId=`. */
export interface CollectionListItem extends CollectionEntity {
  _count?: { items: number };
  previews: VideoType[];
  containsVideo?: boolean;
}

/** A junction row (collection ↔ video); the service stores only `videoId`. */
export interface CollectionItemEntity {
  id: string;
  collectionId: string;
  videoId: string;
  addedById: string;
  note: string | null;
  position: number;
  createdAt: string;
}

/** A collection item hydrated with its video details (null if deleted/orphaned). */
export interface HydratedCollectionItem extends CollectionItemEntity {
  video: VideoType | null;
}

/** A single collection with its ordered, hydrated items (detail view). */
export interface CollectionDetail extends CollectionEntity {
  items: HydratedCollectionItem[];
}

/** Paginated list of collections (`getMyCollections` / by owner). */
export type CollectionsListResponse = ApiResponse<CollectionListItem[]>;

/** Single collection + hydrated items (`getCollectionBySlug`). */
export type CollectionDetailResponse = ApiResponse<CollectionDetail>;

/** Create/update collection result. */
export type CollectionResponse = ApiResponse<CollectionEntity>;

/** Add/update item result. */
export type CollectionItemResponse = ApiResponse<CollectionItemEntity>;

/** Flat distinct set of the caller's curated videoIds (`getCuratedIds`). */
export type CuratedIdsResponse = ApiResponse<string[]>;
