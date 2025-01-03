import { Request, Response } from "express";

import express from 'express';
import {
    createUser,
    getUser,
    updateUser,
    deleteUser,
    getUsers,
    updateFollower,
    getFollowers,
    updateUserRole
} from '../controllers/userController';
import { requireAuth } from "@clerk/express";
import { authMiddleware } from "../middlewares/authMiddleware";

const userRouter = express.Router(); 

// Public Routes
userRouter.get("/", getUsers);
userRouter.post("/create", createUser); // Create a new user
userRouter.get("/profile/:userId",getUser) //Get other user profile

// Protected Routes
    // User Profile Protected Routes
    // userRouter.use("/:userId/*",authMiddleware)
    userRouter.get("/:userId/myprofile",authMiddleware,getUser); // Get user own profile
    userRouter.put("/:userId/myprofile", authMiddleware,updateUser); // Update user profile
    userRouter.delete("/:userId/myprofile",authMiddleware, deleteUser); // Delete user profile
    userRouter.put("/:userId/follow",authMiddleware,updateFollower)
    userRouter.put("/:username/role",authMiddleware,updateUserRole)
    userRouter.get("/:userId/followers",getFollowers)


    // User Videos Protected Routes
   
    userRouter.get("/:userId/videos/:videoId",requireAuth({apiUrl:"/erros/sign-in"})); // Get specific video
    userRouter.put("/:userId/videos/:videoId",requireAuth({apiUrl:"/erros/sign-in"})); // Update specific video
    

export default userRouter;
