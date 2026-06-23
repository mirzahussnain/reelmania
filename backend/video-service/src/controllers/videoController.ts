import prisma from "../utils/dbconnection.config";
import { v4 as uuidv4 } from "uuid";
import { Request, Response } from "express";
import { StorageFactory } from "../providers/StorageFactory";

import { getRedisClient } from "../utils/redis";
import { shuffleArray } from "../utils/shuffleArray";
import { ok, fail } from "../utils/http";

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
                const shuffled = shuffleArray(parsedPayload.videos);
                ok(res, shuffled, { nextCursor: parsedPayload.nextCursor, limit: parsedPayload.limit }, "Videos Fetched Successfully");
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
            ok(res, [], { nextCursor: null }, "No Video Exists in Database");
            return;
        }

        const formattedDateVideos = videos.map((video) => ({
            ...video,
            uploaded_at: video.uploaded_at.toISOString(),
        }));

        const nextCursor = videos.length === limit ? videos[videos.length - 1].id : null;

        // Cache the ORIGINAL (unshuffled) array so the cache is consistent.
        const cachePayload = { videos: formattedDateVideos, nextCursor, limit };
        try {
            await redisClient.setEx(cacheKey, 60, JSON.stringify(cachePayload));
        } catch (cacheErr) {
            console.error("Redis Cache Write Error:", cacheErr);
        }

        // Shuffle just before sending it to the current user.
        ok(res, shuffleArray(formattedDateVideos), { nextCursor, limit }, "Videos Fetched Successfully");
        return;
    } catch (err: unknown) {
        console.error(err);
        fail(res, 500, "Operation Failed", err);
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
            fail(res, 404, "No Video Found");
            return;
        }
        ok(res, result, undefined, "Video Found Successfully");
        return;
    }
    catch(error){
        fail(res, 500, "Operation Failed", error);
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

        ok(
            res,
            formattedDateVideos,
            { nextCursor },
            videos.length
                ? `${videos.length} videos found`
                : "User Hasn't Uploaded Any Video Yet"
        );
        return;
    } catch (err: unknown) {
        fail(res, 500, "Operation Failed", err);
        return;
    }
};

export const getLikesByVideoId = async (req: Request, res: Response) => {
    try {
        const videoId = req?.params?.videoId;
        const cursor = req.query.cursor as string | undefined;
        const limit = parseInt(req.query.limit as string) || 20;

        if (!videoId) {
            fail(res, 400, "Video Id is missing");
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

        ok(res, mappedLikes, { nextCursor }, "Likes Fetched Successfully");
        return;
    } catch (err: unknown) {
        console.error(err);
        fail(res, 500, "Operation Failed", err);
        return;
    }
}

export const getCommentsByVideoId = async (req: Request, res: Response) => {
    try {
        const videoId = req.params.videoId;
        const cursor = req.query.cursor as string | undefined;
        const limit = parseInt(req.query.limit as string) || 20;

        if (!videoId) {
            fail(res, 400, "Video Id is missing");
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

        ok(res, mappedComments, { nextCursor }, "Comments Fetched Successfully");
        return;
    } catch (err: unknown) {
        console.error(err);
        fail(res, 500, "Operation Failed", err);
        return;
    }
}

export const generateUploadUrl = async (req: Request, res: Response) => {
    try {
        const { fileName, contentType } = req.body;
        if (!fileName || !contentType) {
            fail(res, 400, "fileName and contentType are required");
            return;
        }

        const uniqueName = `${uuidv4()}-${fileName}`;
        const storageProvider = StorageFactory.getProvider();
        const signedUrl = await storageProvider.generateSignedUploadUrl(uniqueName, contentType);

        ok(res, { signedUrl, fileName: uniqueName }, undefined, "Upload URL generated");
        return;
    } catch (err: unknown) {
        fail(res, 500, "Failed to generate upload URL", err);
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

        ok(res, result, undefined, "Video Created Successfully.");
        return;
    } catch (err: unknown) {
        fail(res, 500, "Video is not Stored in Database", err);
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
                ok(res, null, undefined, "Video Deleted Successfully.");
                return;
            }
        } else {
            fail(res, 500, "Video file could not be deleted from storage");
            return;
        }
    } catch (err: unknown) {
        fail(res, 500, "Video could not be deleted", err);
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

        ok(
            res,
            { videoId, comment: mappedComment, commentCount: updatedVideo.commentCount },
            undefined,
            "Comment Posted Successfully"
        );
        return;
    } catch (err: unknown) {
        console.error(err);
        fail(res, 500, "Operation Failed", err);
        return;
    }
};

export const updateLikes = async (req: Request, res: Response) => {
    const videoId = req.params.videoId;
    const userData: { userId: string, userName: string } = req.body.userData;

    try {
        if (!videoId || !userData?.userId || !userData?.userName) {
            fail(res, 400, "Video ID or User data is incomplete");
            return;
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
        } catch (txErr: unknown) {
            // A concurrent request already applied the same toggle (duplicate
            // like P2002 / already-deleted P2025). The winning request kept the
            // count correct, so treat this as a no-op and return current state.
            const code = (txErr as { code?: string })?.code;
            if (code !== "P2002" && code !== "P2025") {
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

        ok(res, { videoId, updatedLikes: mappedLikes }, undefined, "Likes Updated");
        return;
    } catch (err: unknown) {
        console.error(err);
        fail(res, 500, "Operation Failed", err);
        return;
    }
};