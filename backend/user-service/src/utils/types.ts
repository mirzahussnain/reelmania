import type { Role } from "@/constants/roles";

// The user-creation contract carried on `user_events` (Clerk webhook → worker).
// Only these fields come from Clerk; everything else (bio, c_score*, status
// flags) is server-defaulted at the DB layer.
export type userType = {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string;
  email: string;
  username: string;
  role: Role;
  created_at: Date;
};