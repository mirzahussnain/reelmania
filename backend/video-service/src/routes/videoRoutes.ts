import express from "express";

import {addNewComment, createVideo, deleteVideo, getCommentsByVideoId, getLikesByVideoId, getUserVideos, getVideoById, getVideos, getVideosBatch, updateLikes, generateUploadUrl, registerView} from "../controllers/videoController";
import { authMiddleware } from "../middelwares/authMiddleware";

import { getForYouFeed, getFollowingFeed } from "../controllers/feedController";

const videoRouter=express.Router();

videoRouter.get("/",getVideos)
videoRouter.get("/foryou", authMiddleware, getForYouFeed)
videoRouter.get("/following", authMiddleware, getFollowingFeed)

// STATIC ROUTES (Must come before dynamic routes!)
videoRouter.get("/generate-upload-url", (req, res) => { res.status(405).json({ error: "Method Not Allowed - Use POST" }); });
videoRouter.post("/generate-upload-url", authMiddleware, generateUploadUrl);
videoRouter.post("/video", authMiddleware, createVideo); // save metadata after upload
// Internal batch resolution for other services holding soft videoId refs.
videoRouter.post("/batch", getVideosBatch);

// DYNAMIC ROUTES
videoRouter.get("/user/:userId",getUserVideos) // get videos of a user
videoRouter.get("/:videoId",getVideoById)
videoRouter.get("/:videoId/likes",getLikesByVideoId);
videoRouter.get("/:videoId/comments",getCommentsByVideoId)

videoRouter.post("/:videoId/view",registerView) // register a view (deduped, auth-optional)
videoRouter.post("/:videoId/comments",authMiddleware,addNewComment) //add new comment
videoRouter.put("/:videoId/likes",authMiddleware,updateLikes)
videoRouter.delete("/:videoId",authMiddleware,deleteVideo)

export default videoRouter;