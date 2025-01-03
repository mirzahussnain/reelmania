export {}

// Create a type for the roles
export type Roles = 'admin' | 'moderator'

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
  followers:FollowerType[],
};

export type FollowerType={
  follower_id:string,
  following_id:string,
  created_at:Date
}

export type LoaderType = {
  isLoading: boolean;
};


export type VideoType={
  id? : string,
  Likes:VideoLikes[]
  comments:CommentType[]
  hashtags:string[]
  title:string
  uploaded_at:string
  uploaded_by:VideoUploader
  video_url?:string
}

export type VideoUploader={
  id:string,
  username:string,
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
