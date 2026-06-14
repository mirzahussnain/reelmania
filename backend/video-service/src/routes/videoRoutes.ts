import express from "express";

import {addNewComment, createVideo, deleteVideo, getCommentsByVideoId, getLikesByVideoId, getUserVideos, getVideoById, getVideos, updateLikes, generateUploadUrl} from "../controllers/videoController";
import { authMiddleware } from "../middelwares/authMiddleware";

const videoRouter=express.Router();

videoRouter.get("/",getVideos)

videoRouter.get("/user/:userId",getUserVideos) // get videos of a user
videoRouter.get("/:videoId",getVideoById)
videoRouter.get("/:videoId/likes",getLikesByVideoId);
videoRouter.get("/:videoId/comments",getCommentsByVideoId)

videoRouter.post("/generate-upload-url", authMiddleware, generateUploadUrl);
videoRouter.post("/video", authMiddleware, createVideo); // save metadata after upload
videoRouter.post("/:videoId/comments",authMiddleware,addNewComment) //add new comment
videoRouter.put("/:videoId/likes",authMiddleware,updateLikes)
videoRouter.delete("/:videoId",authMiddleware,deleteVideo)

export default videoRouter;