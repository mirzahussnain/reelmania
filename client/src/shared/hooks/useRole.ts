import { useUser } from "@clerk/clerk-react";
import { ADMIN_ROLE, type Role } from "../constants/roles";

// Single, rules-of-hooks-safe way to read the current user's role.
// Replaces the old `checkRole` helper, which illegally called useUser()
// inside a plain async function and returned a Promise for a sync value.
export const useRole = (): { role: Role | undefined; isAdmin: boolean; isLoaded: boolean } => {
  const { user, isLoaded } = useUser();
  // Clerk stores the role as a free string; it may be a product Role or the
  // reserved admin sentinel, so compare against the raw value.
  const rawRole = user?.publicMetadata?.role as string | undefined;
  const role = rawRole as Role | undefined;
  return { role, isAdmin: rawRole === ADMIN_ROLE, isLoaded };
};
