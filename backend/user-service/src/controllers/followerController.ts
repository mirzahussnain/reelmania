import { Request, Response } from "express";
import prisma from "../utils/dbconnection.config";
import { Prisma } from "@prisma/client";

export const getFollowers = async (req: Request, res: Response) => {
  try {
    const userId = req?.params?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "User Id is missing" });
      return;
    }

    // Pagination Params
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Fetch followers WITH the user details to prevent N+1 queries
    const result = await prisma.followers.findMany({
      where: {
        following_id: userId,
      },
      include: {
        // Fetch the user data of the person doing the following
        users_followers_follower_idTousers: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
            first_name: true,
            last_name: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
    });

    const totalFollowers = await prisma.followers.count({
      where: { following_id: userId },
    });

    res.status(200).json({
      success: true,
      message: "Followers Fetched Successfully",
      result,
      page,
      limit,
      total: totalFollowers,
    });
    return;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ success: false, message: "Operation Failed", error: errorMsg });
    return;
  }
};

export const updateFollower = async (req: Request, res: Response) => {
  try {
    const follower_id: string = req?.body?.followerId;
    const following_id: string = req?.params?.userId;

    if (!follower_id || !following_id) {
      res.status(400).json({ success: false, message: "Follower or Following Id is missing" });
      return;
    }

    // Attempt to follow (Create)
    try {
      const result = await prisma.followers.create({
        data: {
          follower_id,
          following_id,
        },
      });
      res.status(200).json({ success: true, message: "Follower Added Successfully", result });
      return;
    } catch (createErr: any) {
      // P2002 means Unique Constraint Failed (They are already following)
      if (createErr.code === "P2002") {
        // Safe to Unfollow (Delete)
        const result = await prisma.followers.delete({
          where: {
            follower_id_following_id: {
              follower_id: follower_id,
              following_id: following_id,
            },
          },
        });
        res.status(200).json({ success: true, message: "Unfollowed", result: null });
        return;
      }
      
      // If it's a different error, throw it to the main catch block
      throw createErr;
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    console.error(err);
    res.status(500).json({ success: false, message: "Operation Failed", error: errorMsg });
  }
};
