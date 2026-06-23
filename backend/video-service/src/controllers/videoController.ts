import prisma from "../utils/dbconnection.config";
import { v4 as uuidv4 } from "uuid";
import { Request, Response } from "express";
import { StorageFactory } from "../providers/StorageFactory";

import { getRedisClient } from "../utils/redis";
import { shuffleArray } from "../utils/shuffleArray";

export const getVideos = async (req: Request, res: Response) => {
    try {
        const cursor = req.query.cursor as string | undefined;
        const limit = parseInt(req.query.limit as string) || 10;
        const q = req.query.q as string | undefined;
        const type = req.query.type as string | undefined;

        // Redis Caching
        const redisClient = getRedisClient();
        const cacheKey = `explore:limit_${limit}:cursor_${cursor || 'initial'}:q_${q || 'none'}:type_${type || 'none'}`;
        
        try {
            const cachedData = await redisClient.get(cacheKey);
            if (cachedData) {
                const parsedPayload = JSON.parse(cachedData);
                // Shuffle the cached videos so every guest gets a randomized experience
                parsedPayload.videos = shuffleArray(parsedPayload.videos);
                res.status(200).send(parsedPayload);
                return;
            }
        } catch (cacheErr) {
            console.error("Redis Cache Read Error:", cacheErr);
        }

        let whereClause: any = {};

        if (q) {
            if (type === "hashtag") {
                whereClause = {
                    hashtags: {
                        has: q
                    }
                };
            } else if (type === "title") {
                whereClause = {
                    title: {
                        contains: q,
                        mode: 'insensitive'
                    }
                };
            }
        }

        const cursorObj = cursor ? { id: cursor } : undefined;

        const videos = await prisma.videos.findMany({
            take: limit,
            skip: cursor ? 1 : 0,
            cursor: cursorObj,
            where: whereClause,
            orderBy: { uploaded_at: "desc" }
        });

        if (videos.length === 0) {
            const emptyPayload = { message: "No Video Exists in Database", videos: [], nextCursor: null };
            res.status(200).send(emptyPayload);
            return;
        }

        let formattedDateVideos = videos.map((video) => ({
            ...video,
            uploaded_at: video.uploaded_at.toISOString(),
        }));

        const nextCursor = videos.length === limit ? videos[videos.length - 1].id : null;
        
        const payload = { message: "Videos Fetched Successfully", videos: formattedDateVideos, nextCursor, limit };
        
        try {
            // Cache the ORIGINAL (unshuffled) array so the cache is consistent
            await redisClient.setEx(cacheKey, 60, JSON.stringify(payload));
        } catch (cacheErr) {
            console.error("Redis Cache Write Error:", cacheErr);
        }

        // Shuffle the payload just before sending it to the current user
        payload.videos = shuffleArray(payload.videos);
        res.status(200).send(payload);
        return;
    } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        console.error(err);
        res.status(500).send(`Operation Failed:${errorMsg}`);
        return;
    }
};

export const getVideoById=async(req:Request,res:Response)=>{
    try{
        const videoId=req?.params?.videoId
        const result=await prisma.videos.findUnique({
            where:{
                id:videoId
            }
        })
        if(!result){
            res.status(200).send({message:"No Video Found",videos:null})
            return;
        }
        res.status(200).send({message:"Video Found Successfully",video:result})
        return;
    }
    catch(error){
        res.status(500).send(error)
    }
}

export const getUserVideos = async (req: Request, res: Response) => {
    try {
        const uploaderId = req.params.userId;

        // Pagination is opt-in: callers that pass `limit` get a cursor-paginated
        // page (backed by the @@index on uploaded_by.id + uploaded_at); callers
        // that omit it keep the previous "return everything" behavior.
        const paginated = req.query.limit !== undefined;
        const limit = parseInt(req.query.limit as string) || 12;
        const cursor = req.query.cursor as string | undefined;

        const videos = await prisma.videos.findMany({
            where: {
                uploaded_by: {
                    is: {
                        id: uploaderId,
                    },
                },
            },
            orderBy: { uploaded_at: "desc" },
            ...(paginated
                ? {
                      take: limit,
                      skip: cursor ? 1 : 0,
                      cursor: cursor ? { id: cursor } : undefined,
                  }
                : {}),
        });

        const formattedDateVideos = videos.map((video) => ({
            ...video,
            uploaded_at: video.uploaded_at.toISOString(),
        }));

        const nextCursor =
            paginated && videos.length === limit ? videos[videos.length - 1].id : null;

        res.status(200).send({
            message: videos.length
                ? `${videos.length} videos found`
                : "User Hasn't Uploaded Any Video Yet",
            videos: formattedDateVideos,
            nextCursor,
        });
        return;
    } catch (err: any) {
        res
            .status(500)
            .send(`Operation Failed:${err}`);
        return;
    }
};

export const getLikesByVideoId = async (req: Request, res: Response) => {
    try {
        const videoId = req?.params?.videoId;
        const cursor = req.query.cursor as string | undefined;
        const limit = parseInt(req.query.limit as string) || 20;

        if (!videoId) {
            res.status(400).send("Video Id is missing");
            return;
        }

        const cursorObj = cursor ? { id: cursor } : undefined;

        const likes = await prisma.like.findMany({
            where: {
                videoId: videoId
            },
            take: limit,
            skip: cursor ? 1 : 0,
            cursor: cursorObj,
            orderBy: { id: "desc" }
        });

        const nextCursor = likes.length === limit ? likes[likes.length - 1].id : null;

        const mappedLikes = likes.map((like) => ({
            liked_by: {
                id: like.userId,
                username: like.username
            }
        }));

        res.status(200).send({ message: "Likes Fetched Successfully", likes: mappedLikes, nextCursor });
        return;
    } catch (err: any) {
        res.status(500).send(`Operation Failed:${err}`);
        console.log(err);
        return;
    }
}

export const getCommentsByVideoId = async (req: Request, res: Response) => {
    try {
        const videoId = req.params.videoId;
        const cursor = req.query.cursor as string | undefined;
        const limit = parseInt(req.query.limit as string) || 20;

        if (!videoId) {
            res.status(400).send("Video Id is missing");
            return;
        }

        const cursorObj = cursor ? { id: cursor } : undefined;

        const comments = await prisma.comment.findMany({
            where: { videoId: videoId },
            take: limit,
            skip: cursor ? 1 : 0,
            cursor: cursorObj,
            orderBy: { posted_at: "desc" }
        });

        const nextCursor = comments.length === limit ? comments[comments.length - 1].id : null;

        const mappedComments = comments.map(comment => ({
            author: {
                id: comment.userId,
                username: comment.username,
                avatar_url: comment.avatar_url
            },
            posted_at: comment.posted_at,
            text: comment.text
        }));

        res.status(200).send({ message: "Comments Fetched Successfully", comments: mappedComments, nextCursor });
        return;
    } catch (err: any) {
        console.error(err);
        res.status(500).send(`Operation Failed:${err}`);
        return;
    }
}

export const generateUploadUrl = async (req: Request, res: Response) => {
    try {
        const { fileName, contentType } = req.body;
        if (!fileName || !contentType) {
            res.status(400).json({ error: "fileName and contentType are required" });
            return;
        }

        const uniqueName = `${uuidv4()}-${fileName}`;
        const storageProvider = StorageFactory.getProvider();
        const signedUrl = await storageProvider.generateSignedUploadUrl(uniqueName, contentType);

        res.status(200).json({ signedUrl, fileName: uniqueName });
        return;
    } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        res.status(500).json({ error: `Failed to generate upload URL: ${errorMsg}` });
    }
};

export const createVideo = async (req: Request, res: Response) => {
    try {
        const metadata = typeof req.body.metadata === 'string' 
            ? JSON.parse(req.body.metadata) 
            : (req.body.metadata || req.body);
        const fileName = req.body.fileName;

        if (!metadata || !fileName) {
            throw new Error("Video Meta-Data or fileName is Missing");
        }

        const storageProvider = StorageFactory.getProvider();
        const publicUrl = storageProvider.getPublicUrl(fileName);

        const req_data: {
            title: string;
            uploaded_by: { id: string; username: string };
            uploaded_at: Date;
            hashtags: string[];
        } = metadata;

        const videoData = { 
            title: req_data.title,
            uploaded_by: req_data.uploaded_by,
            uploaded_at: req_data.uploaded_at,
            hashtags: req_data.hashtags,
            video_url: publicUrl 
        };
        const result = await prisma.videos.create({ data: videoData });

        res.status(200).json({ message: "Video Created Successfully.", video: result });
        return;
    } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        res.status(500).json({ error: `Video is not Stored in Database: ${errorMsg}` });
        return;
    }
};
export const deleteVideo = async (req: Request, res: Response) => {
    const videoId = req?.params?.videoId;
    try {
        if (!videoId) {
            throw new Error("Video Id is missing");
        }
        const result = await prisma.videos.findUnique({ where: { id: videoId } });
        if (!result) {
            throw new Error("Video Does not exist");
        }
        
        // Extract filename from URL (e.g. http://minio:9000/videos/filename.mp4 -> filename.mp4)
        const parts = result.video_url.split('/');
        const actualFileName = parts[parts.length - 1];

        const storageProvider = StorageFactory.getProvider();
        const deleted = await storageProvider.deleteFile(actualFileName);
        
        if (deleted) {
            const deleteResult = await prisma.videos.delete({ where: { id: videoId } });
            if (deleteResult) {
                res.status(200).json({ message: "Video Deleted Successfully." });
                return;
            }
        } else {
            res.status(500).json({ error: "Video file could not be deleted from storage" });
            return;
        }
    } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        res.status(500).json({ error: `Video could not be deleted: ${errorMsg}` });
        return;
    }
};

export const addNewComment = async (req: Request, res: Response) => {
    const videoId = req.params.videoId;
    const newComment = req.body;

    try {
        if (!videoId || !newComment) {
            throw new Error("Video Id or Comment is missing");
        }

        // Create the comment and bump the denormalized counter atomically so
        // they can never drift if one of the writes fails.
        const [createdComment, updatedVideo] = await prisma.$transaction([
            prisma.comment.create({
                data: {
                    videoId: videoId,
                    userId: newComment.author.id,
                    username: newComment.author.username,
                    avatar_url: newComment.author.avatar_url,
                    posted_at: new Date(),
                    text: newComment.text
                }
            }),
            prisma.videos.update({
                where: { id: videoId },
                data: {
                    commentCount: { increment: 1 }
                }
            })
        ]);

        const mappedComment = {
            author: {
                id: createdComment.userId,
                username: createdComment.username,
                avatar_url: createdComment.avatar_url
            },
            posted_at: createdComment.posted_at,
            text: createdComment.text
        };

        res.status(200).send({ 
            message: "Comment Posted Successfully", 
            newVideos: updatedVideo, 
            videoId: videoId, 
            newComments: mappedComment,
            commentsCount: updatedVideo.commentCount 
        });
        return;
    } catch (err: any) {
        console.error(err);
        res.status(500).send(`Operation Failed:${err}`);
        return;
    }
};

export const updateLikes = async (req: Request, res: Response) => {
    const videoId = req.params.videoId;
    const userData: { userId: string, userName: string } = req.body.userData;

    try {
        if (!videoId || !userData?.userId || !userData?.userName) {
            throw new Error("Video ID or User data is incomplete");
        }

        const existingLike = await prisma.like.findUnique({
            where: {
                videoId_userId: {
                    videoId: videoId,
                    userId: userData.userId
                }
            }
        });

        try {
            if (existingLike) {
                // User already liked it, so UNLIKE. Delete + decrement run in one
                // transaction; the @@unique constraint plus the all-or-nothing
                // transaction prevent the counter from drifting under concurrency.
                await prisma.$transaction([
                    prisma.like.delete({ where: { id: existingLike.id } }),
                    prisma.videos.update({
                        where: { id: videoId },
                        data: { likeCount: { decrement: 1 } }
                    })
                ]);
            } else {
                // User hasn't liked it, so LIKE.
                await prisma.$transaction([
                    prisma.like.create({
                        data: {
                            videoId: videoId,
                            userId: userData.userId,
                            username: userData.userName
                        }
                    }),
                    prisma.videos.update({
                        where: { id: videoId },
                        data: { likeCount: { increment: 1 } }
                    })
                ]);
            }
        } catch (txErr: any) {
            // A concurrent request already applied the same toggle (duplicate
            // like P2002 / already-deleted P2025). The winning request kept the
            // count correct, so treat this as a no-op and return current state.
            if (txErr?.code !== "P2002" && txErr?.code !== "P2025") {
                throw txErr;
            }
        }

        const allLikes = await prisma.like.findMany({
            where: { videoId: videoId }
        });

        const mappedLikes = allLikes.map((like) => ({
            liked_by: {
                id: like.userId,
                username: like.username
            }
        }));

        res.status(200).send({ message: "Likes Updated", videoId, updatedLikes: mappedLikes });
        return;
    } catch (err: any) {
        console.error(err);
        res.status(500).send(`Operation Failed:${err}`);
        return;
    }
};