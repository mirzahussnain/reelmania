import { Request, Response } from "express";
import prisma from "../utils/dbconnection.config";
import { Prisma } from "@prisma/client";
import { ok, fail } from "../utils/http";
import { logger } from "../utils/logger";

export const getFollowers = async (req: Request, res: Response) => {
  try {
    const userId = req?.params?.userId;
    if (!userId) {
      fail(res, 401, "User Id is missing");
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
            // Per-node network metrics for the relations grid. c_score is the
            // persisted percentile (0 until the scoring job runs); the flags let
            // the client badge verified/founding connections.
            c_score: true,
            is_verified: true,
            is_founding_member: true,
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

    ok(res, result, { page, limit, total: totalFollowers }, "Followers Fetched Successfully");
    return;
  } catch (err: unknown) {
    fail(res, 500, "Operation Failed", err);
    return;
  }
};

export const updateFollower = async (req: Request, res: Response) => {
  try {
    const follower_id: string = req?.body?.followerId;
    const following_id: string = req?.params?.userId;

    if (!follower_id || !following_id) {
      fail(res, 400, "Follower or Following Id is missing");
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
      ok(res, result, undefined, "Follower Added Successfully");
      return;
    } catch (createErr: unknown) {
      // P2002 means Unique Constraint Failed (They are already following)
      if (createErr instanceof Prisma.PrismaClientKnownRequestError && createErr.code === "P2002") {
        // Safe to Unfollow (Delete)
        await prisma.followers.delete({
          where: {
            follower_id_following_id: {
              follower_id: follower_id,
              following_id: following_id,
            },
          },
        });
        ok(res, null, undefined, "Unfollowed");
        return;
      }

      // If it's a different error, throw it to the main catch block
      throw createErr;
    }
  } catch (err: unknown) {
    logger.error({ err });
    fail(res, 500, "Operation Failed", err);
  }
};

export const checkFollower = async (req: Request, res: Response) => {
  try {
    const following_id = req.params.userId;
    const follower_id = req.query.followerId as string;

    if (!following_id || !follower_id) {
      fail(res, 400, "Follower or Following Id is missing");
      return;
    }

    const connection = await prisma.followers.findUnique({
      where: {
        follower_id_following_id: {
          follower_id,
          following_id,
        },
      },
    });

    ok(res, { isFollowing: !!connection }, undefined, "Follow status fetched");
  } catch (err: unknown) {
    fail(res, 500, "Operation Failed", err);
  }
};
