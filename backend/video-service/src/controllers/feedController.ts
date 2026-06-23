import { Request, Response } from "express";
import { getRedisClient } from "../utils/redis";
import prisma from "../utils/dbconnection.config";
import { getAuth } from "@clerk/express";

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
        console.error("Trending cache read error:", err);
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
        console.error("Trending cache write error:", err);
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
        console.error("Feed lock error:", err);
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
        console.error("Feed Generator Error:", err);
    } finally {
        try {
            await redisClient.del(lockKey);
        } catch (err) {
            console.error("Feed lock release error:", err);
        }
    }
};

export const getForYouFeed = async (req: Request, res: Response) => {
    try {
        const auth = getAuth(req);
        const userId = auth.userId;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
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
            res.status(200).send({ message: "No Videos", videos: [] });
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

        res.status(200).send({ message: "For You Feed", videos: formattedVideos });
        return;
    } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        console.error("getForYouFeed Error:", err);
        res.status(500).send(`Operation Failed: ${errorMsg}`);
        return;
    }
};
