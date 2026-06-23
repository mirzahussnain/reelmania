import express from 'express';
import {
    createUser,
    getUser,
    getUserByUsername,
    updateUser,
    deleteUser,
    getUsers,
    updateUserRole
} from '../controllers/userController';
import { authMiddleware, requireAdmin } from "../middlewares/authMiddleware";

const userRouter = express.Router(); 

// Public Routes
userRouter.get("/", getUsers);
userRouter.post("/create", createUser); // Create a new user
userRouter.get("/by-username/:username", getUserByUsername) // Get profile by username (O(1))
userRouter.get("/profile/:userId",getUser) //Get other user profile

// Protected Routes
    // User Profile Protected Routes
    // userRouter.use("/:userId/*",authMiddleware)
    userRouter.get("/:userId/myprofile",authMiddleware,getUser); // Get user own profile
    userRouter.put("/:userId/myprofile", authMiddleware,updateUser); // Update user profile
    userRouter.delete("/:userId/myprofile",authMiddleware, deleteUser); // Delete user profile

    // Role changes are admin-only (previously any signed-in user could call this).
    userRouter.put("/:username/role", authMiddleware, requireAdmin, updateUserRole);

export default userRouter;
