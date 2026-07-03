import express from "express";
import { getFollowers, getMutuals, updateFollower, checkFollower } from "../controllers/followerController";
import { authMiddleware } from "../middlewares/authMiddleware";

const followerRouter = express.Router();

// GET all followers for a specific user (Paginated)
followerRouter.get("/:userId/followers", getFollowers);

// GET mutual connections (follows back) for a specific user (Paginated)
followerRouter.get("/:userId/mutuals", getMutuals);

// GET O(1) check if a specific user follows another user
followerRouter.get("/:userId/check-follower", checkFollower);

// PUT follow or unfollow a specific user
followerRouter.put("/:userId/follow", authMiddleware, updateFollower);

export default followerRouter;
