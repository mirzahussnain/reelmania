import type { Role } from './shared/constants/roles'
import type { BadgeItem } from './shared/constants/badges'

// Canonical role type (single source of truth in shared/constants/roles.ts).
export type Roles = Role

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: Roles
    }
  }
}


export type userType = {
  avatar_url:string,
  created_at: string,
  email: string,
  first_name: string,
  id: string,
  last_name: string,
  role: string;
  username: string;
  bio?: string | null,
  is_founding_member?: boolean,
  is_verified?: boolean,
  // Persisted C-Score (0–100 percentile). Written by the nightly scoring job;
  // 0 until that ships. The client only ever reads it.
  c_score?: number,
  // Derived server-side (user-service deriveBadges) and returned in the profile
  // payload; the client only renders them (see shared/components/ui/Badge).
  badges?: BadgeItem[],
  // The API returns denormalized follower/following counts under `_count`
  // (Prisma relation aggregate), not an inlined follower array. Align the type
  // with the actual payload (IMPLEMENTATION_PLAN 8.3).
  _count?: UserCount,
};

// Prisma `_count` aggregate for the two self-referential follower relations.
export type UserCount = {
  followers_followers_following_idTousers?: number,
  followers_followers_follower_idTousers?: number,
};

export type LoaderType = {
  isLoading: boolean;
};


export type VideoVisibility = "PUBLIC" | "UNLISTED" | "PRIVATE" | "DRAFT";
export type VideoSourceType = "NATIVE" | "YOUTUBE" | "TIKTOK" | "VIMEO";
export type VideoProcessingStatus = "UPLOADED" | "PROCESSING" | "READY" | "FAILED";

export type VideoType={
  id? : string,
  likeCount: number,
  commentCount: number,
  view_count?: number,
  hashtags:string[]
  title:string
  description?:string
  uploaded_at:string
  updated_at?:string
  uploaded_by:VideoUploader
  video_url?:string
  thumbnail_url?:string
  source_type?:VideoSourceType
  external_url?:string
  embed_id?:string
  category?:string
  software_used?:string[]
  duration?:number
  width?:number
  height?:number
  fps?:number
  file_size_bytes?:number
  processing_status?:VideoProcessingStatus
  visibility?:VideoVisibility
}

export type VideoUploader={
  id:string,
  username:string,
  avatar_url?:string,
}

export type VideoLikes={
  liked_by:VideoLiker
}
export type VideoLiker={
  id:string,
  username:string,
}


export type CommentType={
  author:CommentAuthor,
  posted_at:Date,
  text:string
}

export type CommentAuthor={
  id:string,
  username:string,
  avatar_url:string
}
