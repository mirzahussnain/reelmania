import {addNewComment, createVideo, deleteVideo, getCommentsByVideoId, getLikesByVideoId, getUserVideos, getVideoById, getVideos, updateLikes} from "../controllers/videoController";
import { authMiddleware } from "../middelwares/authMiddleware";
import fs from "fs";
// import { sasGenerator } from "@/middlewares/sasGenerator";
import express, { Request, Response } from "express";
import multer from "multer";
import path from "path";

// Get the absolute path to the 'uploads/videos' directory
const uploadsDir = path.resolve(__dirname, "../../src/utils/uploads/videos");

// Ensure the directory exists or create it
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
// Set up multer storage to store video files on disk
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      // Use the absolute path
      cb(null, uploadsDir);
    },
  });
  
  // Configure multer to use the storage settings
const upload = multer({ storage });

const videoRouter=express.Router();

videoRouter.get("/",getVideos)
// videoRouter.get("/generate/sas",authMiddleware,sasGenerator)

videoRouter.get("/user/:userId",getUserVideos) // get videos of a user
videoRouter.get("/:videoId",getVideoById)
videoRouter.get("/:videoId/likes",getLikesByVideoId);
videoRouter.get("/:videoId/comments",getCommentsByVideoId)
videoRouter.post("/video",authMiddleware,upload.single("video"),createVideo) //create new video
videoRouter.post("/:videoId/comments",authMiddleware,addNewComment) //add new comment
videoRouter.put("/:videoId/likes",authMiddleware,updateLikes)
videoRouter.delete("/:videoId",authMiddleware,deleteVideo)

export default videoRouter