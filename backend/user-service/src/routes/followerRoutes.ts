import express from "express";
import { getFollowers, updateFollower } from "../controllers/followerController";
import { authMiddleware } from "../middlewares/authMiddleware";

const followerRouter = express.Router();

// GET all followers for a specific user (Paginated)
followerRouter.get("/:userId/followers", getFollowers);

// PUT follow or unfollow a specific user
followerRouter.put("/:userId/follow", authMiddleware, updateFollower);

export default followerRouter;
