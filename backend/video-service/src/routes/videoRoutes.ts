import express from "express";

import {addNewComment, createVideo, deleteVideo, getCommentsByVideoId, getLikesByVideoId, getUserVideos, getVideoById, getVideos, updateLikes, generateUploadUrl} from "../controllers/videoController";
import { authMiddleware } from "../middelwares/authMiddleware";

import { getForYouFeed } from "../controllers/feedController";

const videoRouter=express.Router();

videoRouter.get("/",getVideos)
videoRouter.get("/foryou", authMiddleware, getForYouFeed)

// STATIC ROUTES (Must come before dynamic routes!)
videoRouter.get("/generate-upload-url", (req, res) => { res.status(405).json({ error: "Method Not Allowed - Use POST" }); });
videoRouter.post("/generate-upload-url", authMiddleware, generateUploadUrl);
videoRouter.post("/video", authMiddleware, createVideo); // save metadata after upload

// DYNAMIC ROUTES
videoRouter.get("/user/:userId",getUserVideos) // get videos of a user
videoRouter.get("/:videoId",getVideoById)
videoRouter.get("/:videoId/likes",getLikesByVideoId);
videoRouter.get("/:videoId/comments",getCommentsByVideoId)

videoRouter.post("/:videoId/comments",authMiddleware,addNewComment) //add new comment
videoRouter.put("/:videoId/likes",authMiddleware,updateLikes)
videoRouter.delete("/:videoId",authMiddleware,deleteVideo)

export default videoRouter;