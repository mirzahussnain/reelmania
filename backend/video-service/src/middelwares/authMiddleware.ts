import { getAuth } from "@clerk/express";
import { Response, NextFunction, Request } from "express";

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const auth = getAuth(req);  // Get the authentication context

  // Check if user is authenticated
  if (!auth.userId) {
    // Respond with 401 Unauthorized instead of redirecting
    res.status(401).json({ message: "User not signed in" });
    return;
  }

  // If authenticated, proceed to the next middleware or route handler
  next();
};
