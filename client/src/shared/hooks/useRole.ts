import { useUser } from "@clerk/clerk-react";
import { ADMIN_ROLE, type Role } from "../constants/roles";

// Single, rules-of-hooks-safe way to read the current user's role.
// Replaces the old `checkRole` helper, which illegally called useUser()
// inside a plain async function and returned a Promise for a sync value.
export const useRole = (): { role: Role | undefined; isAdmin: boolean; isLoaded: boolean } => {
  const { user, isLoaded } = useUser();
  const role = user?.publicMetadata?.role as Role | undefined;
  return { role, isAdmin: role === ADMIN_ROLE, isLoaded };
};
