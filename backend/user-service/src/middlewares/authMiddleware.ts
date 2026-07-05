import { clerkClient, getAuth } from "@clerk/express";
import { Response, NextFunction, Request } from "express";
import { touchLastActive } from "../utils/activity";

// Requires a signed-in user. Returns 401 JSON (an API must not redirect).
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const auth = getAuth(req);
    if (!auth.userId) {
        res.status(401).json({ success: false, message: "Authentication required" });
        return;
    }
    // Record activity (throttled, fire-and-forget) for the C-Score pool window.
    touchLastActive(auth.userId);
    next();
};

// Requires the signed-in user to have the admin role (Clerk publicMetadata).
// Read from Clerk directly so it does not depend on session-claim config.
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
    const auth = getAuth(req);
    if (!auth.userId) {
        res.status(401).json({ success: false, message: "Authentication required" });
        return;
    }
    try {
        const user = await clerkClient.users.getUser(auth.userId);
        if (user.publicMetadata?.role !== "admin") {
            res.status(403).json({ success: false, message: "Admin access required" });
            return;
        }
        next();
    } catch {
        res.status(403).json({ success: false, message: "Admin access required" });
    }
};