import { Request, Response } from "express";
import prisma from "../utils/dbconnection.config";
import { Prisma } from "@prisma/client";
import { ok, fail } from "../utils/http";
import { logger } from "../utils/logger";
import { rabbitMQService } from "../utils/rabbitmq";

// Tell downstream services the follower's follow-set changed so they can bust
// any cached copy (video-service caches it for the Following feed). Fire-and-
// forget on the shared `user_events` fanout — a publish blip must never fail the
// follow/unfollow the user already succeeded at.
const emitFollowChanged = (followerId: string) => {
  rabbitMQService
    .publishToExchange("user_events", { eventType: "follow.changed", data: { followerId } })
    .catch((err) => logger.error({ err }, "publish follow.changed failed"));
};

// Single projection for a follower/mutual node so both endpoints stay in sync.
// c_score is the persisted percentile; the flags let the client badge nodes.
const FOLLOWER_NODE_SELECT = {
  id: true,
  username: true,
  avatar_url: true,
  first_name: true,
  last_name: true,
  c_score: true,
  is_verified: true,
  is_founding_member: true,
} satisfies Prisma.usersSelect;

/**
 * Given the owner (`userId`) and the node ids on the current page, return the
 * subset that are MUTUAL (both follow each other), so the client can badge them
 * "In Sync" inline instead of needing a separate mutuals tab. One indexed IN
 * query over just the page's ids — cheap regardless of total network size.
 *
 * Direction matters:
 *  - "followers" page: a node is mutual if the OWNER follows it back
 *    (row: follower_id = owner, following_id = node).
 *  - "following" page: a node is mutual if it follows the OWNER back
 *    (row: follower_id = node, following_id = owner).
 */
const mutualIdSet = async (
  userId: string,
  nodeIds: string[],
  page: "followers" | "following"
): Promise<Set<string>> => {
  if (nodeIds.length === 0) return new Set();
  const where: Prisma.followersWhereInput =
    page === "followers"
      ? { follower_id: userId, following_id: { in: nodeIds } }
      : { following_id: userId, follower_id: { in: nodeIds } };
  const rows = await prisma.followers.findMany({
    where,
    select: { follower_id: true, following_id: true },
  });
  // The mutual node id is the OTHER side of the edge from the owner.
  return new Set(rows.map((r) => (page === "followers" ? r.following_id : r.follower_id)));
};

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
        users_followers_follower_idTousers: { select: FOLLOWER_NODE_SELECT },
      },
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
    });

    const totalFollowers = await prisma.followers.count({
      where: { following_id: userId },
    });

    // Badge the nodes the owner also follows back (mutual → "In Sync").
    const nodeIds = result
      .map((e) => e.users_followers_follower_idTousers?.id)
      .filter((id): id is string => Boolean(id));
    const mutuals = await mutualIdSet(userId, nodeIds, "followers");
    const withMutual = result.map((e) => ({
      ...e,
      users_followers_follower_idTousers: e.users_followers_follower_idTousers
        ? { ...e.users_followers_follower_idTousers, isMutual: mutuals.has(e.users_followers_follower_idTousers.id) }
        : e.users_followers_follower_idTousers,
    }));

    ok(res, withMutual, { page, limit, total: totalFollowers }, "Followers Fetched Successfully");
    return;
  } catch (err: unknown) {
    fail(res, 500, "Operation Failed", err);
    return;
  }
};

// Mutuals = users who follow this user AND whom this user follows back.
// Two-step: fetch the ids this user follows, then the follower edges among them.
// O(following) load + one indexed IN query (same node projection as followers).
export const getMutuals = async (req: Request, res: Response) => {
  try {
    const userId = req?.params?.userId;
    if (!userId) {
      fail(res, 401, "User Id is missing");
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Ids this user follows.
    const following = await prisma.followers.findMany({
      where: { follower_id: userId },
      select: { following_id: true },
    });
    const followingIds = following.map((f) => f.following_id);

    if (followingIds.length === 0) {
      ok(res, [], { page, limit, total: 0 }, "Mutuals Fetched Successfully");
      return;
    }

    // Followers of this user who are also in the followed set = mutuals.
    const where: Prisma.followersWhereInput = {
      following_id: userId,
      follower_id: { in: followingIds },
    };

    const [result, total] = await Promise.all([
      prisma.followers.findMany({
        where,
        include: { users_followers_follower_idTousers: { select: FOLLOWER_NODE_SELECT } },
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
      prisma.followers.count({ where }),
    ]);

    ok(res, result, { page, limit, total }, "Mutuals Fetched Successfully");
    return;
  } catch (err: unknown) {
    fail(res, 500, "Operation Failed", err);
    return;
  }
};

// The "Following" list — users this person follows (outbound edges), with full
// node details for rendering. Mirrors getFollowers but walks the other relation:
// where follower_id = userId, include the FOLLOWED user's node.
export const getFollowing = async (req: Request, res: Response) => {
  try {
    const userId = req?.params?.userId;
    if (!userId) {
      fail(res, 401, "User Id is missing");
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [result, total] = await Promise.all([
      prisma.followers.findMany({
        where: { follower_id: userId },
        include: {
          users_followers_following_idTousers: { select: FOLLOWER_NODE_SELECT },
        },
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
      prisma.followers.count({ where: { follower_id: userId } }),
    ]);

    // Badge the nodes that follow the owner back (mutual → "In Sync").
    const nodeIds = result
      .map((e) => e.users_followers_following_idTousers?.id)
      .filter((id): id is string => Boolean(id));
    const mutuals = await mutualIdSet(userId, nodeIds, "following");
    const withMutual = result.map((e) => ({
      ...e,
      users_followers_following_idTousers: e.users_followers_following_idTousers
        ? { ...e.users_followers_following_idTousers, isMutual: mutuals.has(e.users_followers_following_idTousers.id) }
        : e.users_followers_following_idTousers,
    }));

    ok(res, withMutual, { page, limit, total }, "Following Fetched Successfully");
    return;
  } catch (err: unknown) {
    fail(res, 500, "Operation Failed", err);
    return;
  }
};

// Internal sync-resolution endpoint (messaging-contract §1): returns the flat
// set of creator ids this user follows. video-service reads this to build the
// Following feed (videos where uploaded_by.id ∈ this set) — it can't query the
// follow graph directly because that lives in the user-service database.
export const getFollowingIds = async (req: Request, res: Response) => {
  try {
    const userId = req?.params?.userId;
    if (!userId) {
      fail(res, 400, "User Id is missing");
      return;
    }

    // Most-recently-followed first so a downstream fan-out cap (video-service
    // Following feed) keeps the freshest connections rather than an arbitrary slice.
    const following = await prisma.followers.findMany({
      where: { follower_id: userId },
      select: { following_id: true },
      orderBy: { created_at: "desc" },
    });

    ok(res, following.map((f) => f.following_id), undefined, "Following ids fetched");
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
      emitFollowChanged(follower_id);
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
        emitFollowChanged(follower_id);
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
