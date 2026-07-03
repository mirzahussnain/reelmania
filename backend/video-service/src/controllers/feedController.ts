import { Request, Response } from "express";
import { getRedisClient } from "../utils/redis";
import prisma from "../utils/dbconnection.config";
import { getAuth } from "@clerk/express";
import { ok, fail } from "../utils/http";
import { logger } from "../utils/logger";
import { fetchFollowingIds } from "../utils/userClient";
import { interleaveByCreator } from "../utils/interleaveByCreator";

const TRENDING_KEY = "trending:videoIds";
const TRENDING_TTL = 300; // 5 minutes

/**
 * Trending is global, so compute it once and share it across all users via a
 * short-lived Redis list instead of running an (indexed) likeCount scan on
 * every per-user feed replenishment.
 */
const getTrendingVideoIds = async (redisClient: any): Promise<string[]> => {
    try {
        const cached = await redisClient.lRange(TRENDING_KEY, 0, -1);
        if (cached && cached.length > 0) return cached;
    } catch (err) {
        logger.error({ err }, "Trending cache read error");
    }

    const trending = await prisma.videos.findMany({
        orderBy: { likeCount: "desc" },
        take: 50,
        select: { id: true },
    });
    const ids = trending.map((v: any) => v.id);

    try {
        if (ids.length > 0) {
            await redisClient.del(TRENDING_KEY);
            await redisClient.rPush(TRENDING_KEY, ids);
            await redisClient.expire(TRENDING_KEY, TRENDING_TTL);
        }
    } catch (err) {
        logger.error({ err }, "Trending cache write error");
    }

    return ids;
};

const generateFeedForUser = async (userId: string, redisClient: any, feedKey: string) => {
    // Per-user lock so overlapping requests don't run duplicate generations.
    const lockKey = `${feedKey}:lock`;
    let locked = false;
    try {
        locked = (await redisClient.set(lockKey, "1", { NX: true, EX: 30 })) === "OK";
    } catch (err) {
        logger.error({ err }, "Feed lock error");
    }
    if (!locked) return; // another generation is already in progress

    try {
        // Find recent interactions
        const likes = await prisma.like.findMany({
            where: { userId },
            orderBy: { id: 'desc' }, 
            take: 20,
            include: { video: true }
        });
        const comments = await prisma.comment.findMany({
            where: { userId },
            orderBy: { posted_at: 'desc' },
            take: 10,
            include: { video: true }
        });

        // Calculate hashtag weights
        const hashtagScores: Record<string, number> = {};
        
        likes.forEach((like: any) => {
            if (like.video && like.video.hashtags) {
                like.video.hashtags.forEach((tag: string) => {
                    hashtagScores[tag] = (hashtagScores[tag] || 0) + 1;
                });
            }
        });
        
        comments.forEach((comment: any) => {
            if (comment.video && comment.video.hashtags) {
                comment.video.hashtags.forEach((tag: string) => {
                    hashtagScores[tag] = (hashtagScores[tag] || 0) + 3;
                });
            }
        });

        // Get top 3 hashtags
        const topHashtags = Object.entries(hashtagScores)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(entry => entry[0]);

        let newVideoIds: string[] = [];

        if (topHashtags.length > 0) {
            // Find videos with these hashtags that the user hasn't interacted with recently
            const interactedIds = [
                ...likes.map((l: any) => l.videoId), 
                ...comments.map((c: any) => c.videoId)
            ];

            const recommended = await prisma.videos.findMany({
                where: {
                    hashtags: { hasSome: topHashtags },
                    id: { notIn: interactedIds }
                },
                orderBy: { uploaded_at: 'desc' },
                take: 50,
                select: { id: true }
            });
            newVideoIds = recommended.map((v: any) => v.id);
        }

        // Cold Start Fallback — read shared trending cache instead of scanning.
        if (newVideoIds.length < 10) {
            const trendingIds = await getTrendingVideoIds(redisClient);
            newVideoIds = Array.from(new Set([...newVideoIds, ...trendingIds]));
        }

        // Push to Redis, skipping ids already queued so the user doesn't see
        // repeats across replenishment runs.
        if (newVideoIds.length > 0) {
            const existing: string[] = await redisClient.lRange(feedKey, 0, -1);
            const existingSet = new Set(existing);
            const toPush = newVideoIds.filter((id) => !existingSet.has(id));
            if (toPush.length > 0) {
                await redisClient.rPush(feedKey, toPush);
            }
        }
    } catch (err) {
        logger.error({ err }, "Feed generator error");
    } finally {
        try {
            await redisClient.del(lockKey);
        } catch (err) {
            logger.error({ err }, "Feed lock release error");
        }
    }
};

// Following-set cache. The follow graph lives in user-service and changes
// rarely, so caching it here removes a cross-service HTTP call on EVERY
// infinite-scroll page. Invalidation is event-driven: user-service emits
// `follow.changed` on follow/unfollow and the userEventsWorker busts this key.
// The TTL is only a safety net for a missed event, not the primary mechanism.
const FOLLOWING_KEY = (userId: string) => `user:${userId}:following`;
const FOLLOWING_TTL = 3600; // 1h safety net

// Guardrail against pathological follow counts (power-users following tens of
// thousands): cap the $in so a single feed read can't turn into a huge query +
// in-memory merge-sort (Mongo's 32MB sort limit). getFollowingIds returns
// most-recently-followed first, so the cap keeps the freshest connections.
const FOLLOWING_FANOUT_CAP = 1000;

const getFollowingIdsCached = async (userId: string, redisClient: any): Promise<string[]> => {
    const key = FOLLOWING_KEY(userId);
    try {
        const cached = await redisClient.get(key);
        if (cached) return JSON.parse(cached);
    } catch (err) {
        logger.error({ err }, "Following cache read error");
    }

    const ids = await fetchFollowingIds(userId);

    try {
        // Cache even an empty set — "follows nobody" is a valid, cacheable answer
        // and avoids hammering user-service for brand-new accounts on every scroll.
        await redisClient.setEx(key, FOLLOWING_TTL, JSON.stringify(ids));
    } catch (err) {
        logger.error({ err }, "Following cache write error");
    }

    return ids;
};

/**
 * Following feed — reverse-chronological videos from the creators the signed-in
 * user follows. Unlike For You (Redis-queued, algorithmic), this is a simple,
 * predictable "latest from people I sync with" feed, so it's a direct
 * cursor-paginated query backed by the @@index([uploaded_at desc, id]).
 *
 * The follow graph lives in user-service, so the followed-id set is resolved via
 * the internal (fail-soft) userClient, cached in Redis. No follows / no videos →
 * empty list, and the client shows an honest empty state.
 *
 * NOTE(scale): this is fan-out-on-READ — cheap at typical follow counts but it
 * degrades for power-users + a huge corpus. The endgame is fan-out-on-WRITE
 * (per-follower precomputed feeds, celebrity hybrid); see the production roadmap.
 */
export const getFollowingFeed = async (req: Request, res: Response) => {
    try {
        const auth = getAuth(req);
        const userId = auth.userId;
        if (!userId) {
            fail(res, 401, "Unauthorized");
            return;
        }

        const limit = parseInt(req.query.limit as string) || 10;
        const cursor = req.query.cursor as string | undefined;

        const redisClient = getRedisClient();
        const allFollowingIds = await getFollowingIdsCached(userId, redisClient);
        if (allFollowingIds.length === 0) {
            ok(res, [], { nextCursor: null }, "Not following anyone yet");
            return;
        }
        const followingIds = allFollowingIds.slice(0, FOLLOWING_FANOUT_CAP);

        const videos = await prisma.videos.findMany({
            where: { uploaded_by: { is: { id: { in: followingIds } } } },
            // Composite sort: uploaded_at isn't unique, so id is the tiebreaker.
            // Without it, ties across page boundaries skip/duplicate items. Backed
            // by @@index([uploaded_at desc, id]).
            orderBy: [{ uploaded_at: "desc" }, { id: "desc" }],
            take: limit,
            skip: cursor ? 1 : 0,
            cursor: cursor ? { id: cursor } : undefined,
        });

        const formattedVideos = videos.map((video: any) => ({
            ...video,
            uploaded_at: video.uploaded_at.toISOString(),
        }));

        // Cursor is taken from the RECENCY-ORDERED page (its last, oldest item)
        // BEFORE interleaving, so pagination stays correct: each page fully consumes
        // a contiguous recency window. Recency wins at page granularity ("new
        // priority"); within the page we round-robin by creator so a batch-uploader
        // is spaced out instead of appearing as one long run. (Cross-page: a creator
        // dominating the very newest videos can still lead consecutive pages — that's
        // correct for a recency feed and only fully solved by fan-out-on-write.)
        const nextCursor = videos.length === limit ? videos[videos.length - 1].id : null;

        ok(res, interleaveByCreator(formattedVideos), { nextCursor }, "Following Feed");
        return;
    } catch (err: unknown) {
        logger.error({ err }, "getFollowingFeed error");
        fail(res, 500, "Operation Failed", err);
        return;
    }
};

export const getForYouFeed = async (req: Request, res: Response) => {
    try {
        const auth = getAuth(req);
        const userId = auth.userId;
        if (!userId) {
            fail(res, 401, "Unauthorized");
            return;
        }

        const redisClient = getRedisClient();
        const feedKey = `user:${userId}:feed`;

        // LPOP top 10 from feed
        const poppedIds = await redisClient.sendCommand(["LPOP", feedKey, "10"]) as string[] | null;
        let videoIds = poppedIds || [];

        if (videoIds.length === 0) {
            // Completely empty (cold start): generate synchronously, then pop.
            // Generation is internally guarded by a per-user lock.
            await generateFeedForUser(userId, redisClient, feedKey);
            const freshPopped = await redisClient.sendCommand(["LPOP", feedKey, "10"]) as string[] | null;
            videoIds = freshPopped || [];
        } else {
            // Have items but running low → replenish in the background.
            const queueLength = await redisClient.lLen(feedKey);
            if (queueLength < 20) {
                generateFeedForUser(userId, redisClient, feedKey); // do not await
            }
        }

        if (videoIds.length === 0) {
            ok(res, [], undefined, "No Videos");
            return;
        }

        // Fetch Metadata
        const videos = await prisma.videos.findMany({
            where: { id: { in: videoIds } }
        });

        // Ensure order matches the queue output
        const orderedVideos = videoIds.map(id => videos.find((v: any) => v.id === id)).filter(Boolean);

        const formattedVideos = orderedVideos.map((video: any) => ({
            ...video,
            uploaded_at: video.uploaded_at.toISOString(),
        }));

        ok(res, formattedVideos, undefined, "For You Feed");
        return;
    } catch (err: unknown) {
        logger.error({ err }, "getForYouFeed error");
        fail(res, 500, "Operation Failed", err);
        return;
    }
};
