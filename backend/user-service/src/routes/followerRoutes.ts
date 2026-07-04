import express from "express";
import { getFollowers, getMutuals, getFollowing, getFollowingIds, updateFollower, checkFollower } from "../controllers/followerController";
import { authMiddleware } from "../middlewares/authMiddleware";

const followerRouter = express.Router();

// GET all followers for a specific user (Paginated)
followerRouter.get("/:userId/followers", getFollowers);

// GET mutual connections (follows back) for a specific user (Paginated)
followerRouter.get("/:userId/mutuals", getMutuals);

// GET the "Synced" list — users this person follows, with node details (Paginated)
followerRouter.get("/:userId/following", getFollowing);

// GET O(1) check if a specific user follows another user
followerRouter.get("/:userId/check-follower", checkFollower);

// GET flat set of ids this user follows (internal sync path for the Following feed)
followerRouter.get("/:userId/following-ids", getFollowingIds);

// PUT follow or unfollow a specific user
followerRouter.put("/:userId/follow", authMiddleware, updateFollower);

export default followerRouter;
