import { useAuth } from "@clerk/clerk-react";
import { useAppSelector } from "../../utils/hooks/storeHooks";
import { RootState } from "../../utils/store/store";
import type { userType } from "../../types";

/**
 * Single source for "who is the current user" (IMPLEMENTATION_PLAN 3.8).
 *
 * Consolidates the three identity reads that were interleaved ad-hoc across
 * the app — the Redux `user` slice, the `auth.token` slice, and Clerk's
 * `isSignedIn` — behind one hook so components/hooks don't each re-derive it.
 */
export interface CurrentUser {
  user: userType;
  token: string | null;
  isSignedIn: boolean;
}

export const useCurrentUser = (): CurrentUser => {
  const user = useAppSelector((state: RootState) => state.user);
  const token = useAppSelector((state: RootState) => state.auth.token);
  const { isSignedIn } = useAuth();
  return { user, token, isSignedIn: Boolean(isSignedIn) };
};
