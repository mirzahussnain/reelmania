import { getAuth } from "@clerk/express";
import { Response, NextFunction, Request } from "express";

/**
 * Requires a signed-in user. Returns 401 JSON (an API must not redirect).
 * On success, the Clerk userId is the owner identity used for authorization
 * (it equals user-service users.id — the soft `ownerId` ref).
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const auth = getAuth(req);
  if (!auth.userId) {
    res.status(401).json({ success: false, message: "Authentication required", data: null });
    return;
  }
  next();
};

/** Resolve the signed-in user's id, or null when anonymous. */
export const getUserId = (req: Request): string | null => getAuth(req).userId ?? null;
