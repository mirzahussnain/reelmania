import { Request, Response } from "express";
import { getRedisClient } from "../utils/redis";
import prisma from "../utils/dbconnection.config";
import { getAuth } from "@clerk/express";

const generateFeedForUser = async (userId: string, redisClient: any, feedKey: string) => {
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

        // Cold Start Fallback
        if (newVideoIds.length < 10) {
            const trending = await prisma.videos.findMany({
                orderBy: { likeCount: 'desc' },
                take: 50,
                select: { id: true }
            });
            // Mix in trending
            const trendingIds = trending.map((v: any) => v.id);
            newVideoIds = Array.from(new Set([...newVideoIds, ...trendingIds]));
        }

        // Push to Redis
        if (newVideoIds.length > 0) {
            await redisClient.rPush(feedKey, newVideoIds);
        }
    } catch (err) {
        console.error("Feed Generator Error:", err);
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

        // Check if queue needs replenishment in background
        const queueLength = await redisClient.lLen(feedKey);
        if (queueLength < 20) {
            // Asynchronous worker trigger (do not await)
            generateFeedForUser(userId, redisClient, feedKey);
        }

        if (videoIds.length === 0) {
            // Await generation just this once if completely empty
            await generateFeedForUser(userId, redisClient, feedKey);
            const freshPopped = await redisClient.sendCommand(["LPOP", feedKey, "10"]) as string[] | null;
            videoIds = freshPopped || [];
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
