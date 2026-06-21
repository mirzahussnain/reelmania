import { Request, Response } from "express";

import prisma from "../utils/dbconnection.config";
import { UserService } from "../services/userService";

export const getUsers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const result = await prisma.users.findMany({
      skip,
      take: limit,
      orderBy: { created_at: "desc" },
    });

    if (result.length === 0) {
      res.status(404).json({ success: false, message: "No user found." });
      return;
    }
    res.status(200).json({ success: true, message: "Users found.", users: result, page, limit });
    return;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ success: false, message: "Something went wrong.", error: errorMsg });
    return;
  }
};

export const getUser = async (req: Request, res: Response) => {
  try {

    const userId = req?.params?.userId;

    // Fetch the user from the database
    const user = await prisma.users.findUnique({
      where: {
        id: userId,
      },
      include: {
        _count: {
          select: {
            followers_followers_following_idTousers: true, // Number of followers
            followers_followers_follower_idTousers: true,  // Number of people they follow
          }
        }
      }
    });

    // Check if user exists
    if (!user) {
      // Respond with 404 if user is not found
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    // Send successful response
    res.status(200).json({ success: true, message: "User Found Successfully", body: user });
    return;
  } catch (err: unknown) {
    // Log the error and send a server error response
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    console.error(err);
    res.status(500).json({ success: false, message: `User not Found`, error: errorMsg });
  }
};


export const createUser = async (req: Request, res: Response) => {
  try {
    const user = await UserService.createUser(req.body);
    res.status(200).json({ success: true, message: "User Created Successfully", body: user });
    return;
  } catch (err: any) {
    if (err.message === "User already exists") {
      res.status(400).json({ success: false, message: "User already exists" });
      return;
    }
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    console.error(err);
    res.status(500).json({ success: false, message: `User Creation Failed`, error: errorMsg });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const targetedUser = req.params.id || req.params.userId;
    const result = await UserService.updateUser(targetedUser, req.body);
    res.status(200).json({ success: true, message: "User Updated Successfully", body: result });
    return;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ success: false, message: `User Updation Failed`, error: errorMsg });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const username = req?.params?.username;
    const newRole = req?.body?.newRole
    if (!username) {
      res.status(401).json({ success: false, message: "User name is missing" });
      return;
    }
    if (!newRole) {
      res.status(401).json({ success: false, message: "User Role is missing" });
      return;
    }
    const result = await prisma.users.update({
      where: {
        username: username,
      },
      data: {
        role: {
          set: newRole
        }
      }
    })

    res.status(200).json({ success: true, message: "USER ROLE UPDATED SUCCESSFULLY", data: result })
    return;

  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ success: false, message: "OPERATION FAILED", error: errorMsg });
  }
}
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const targetedId = req.params.id || req.params.userId;
    await UserService.deleteUser(targetedId);
    res.status(200).json({ success: true, message: "User deleted successfully" });
    return;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ success: false, message: `User deletion failed`, error: errorMsg });
  }
};

