import prisma from "../utils/dbconnection.config";
import { v4 as uuidv4 } from "uuid";
import { Request, Response } from "express";
import { StorageFactory } from "../providers/StorageFactory";

import { getRedisClient } from "../utils/redis";
import { shuffleArray } from "../utils/shuffleArray";
import { ok, fail } from "../utils/http";
import { logger } from "../utils/logger";
import { rabbitMQService, VIDEO_EXCHANGE } from "../utils/rabbitmq";
import { sanitizeSoftware } from "../constants/softwareVocab";
import { sanitizeHashtags, normalizeHashtag } from "../utils/hashtags";

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
            logger.error({ err: cacheErr }, "Redis cache read error");
        }

        // Explore only ever surfaces publicly visible videos — drafts, private
        // (PRO) and unlisted videos must never leak into the public grid.
        let whereClause: any = { visibility: "PUBLIC" };

        if (q) {
            if (type === "hashtag") {
                // Tags are stored normalized, so normalize the query the same way
                // ("#Gaming" / "Gaming" both match stored "gaming").
                whereClause.hashtags = { has: normalizeHashtag(q) };
            } else if (type === "title") {
                whereClause.title = { contains: q, mode: 'insensitive' };
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
            logger.error({ err: cacheErr }, "Redis cache write error");
        }

        // Shuffle just before sending it to the current user.
        ok(res, shuffleArray(formattedDateVideos), { nextCursor, limit }, "Videos Fetched Successfully");
        return;
    } catch (err: unknown) {
        logger.error({ err });
        fail(res, 500, "Operation Failed", err);
        return;
    }
};

// POST /api/videos/batch — resolve many videos by id in one call.
// Internal sync-resolution endpoint (messaging-contract §1): other services
// (e.g. curation-service) hold soft `videoId` refs and hydrate display fields
// through this batched lookup instead of N per-id requests.
const OBJECT_ID = /^[a-fA-F0-9]{24}$/;
const BATCH_MAX = 100;

export const getVideosBatch = async (req: Request, res: Response) => {
    try {
        const ids = req?.body?.ids;
        if (!Array.isArray(ids)) {
            fail(res, 400, "Body must be { ids: string[] }");
            return;
        }
        // Drop malformed ids (a non-ObjectId would make the Mongo query throw)
        // and cap the batch so this can't be turned into a heavy scan. Order is
        // NOT guaranteed — callers map results back by id.
        const validIds = [...new Set(ids)].filter(
            (id): id is string => typeof id === "string" && OBJECT_ID.test(id)
        );
        if (validIds.length === 0) {
            ok(res, [], undefined, "No valid ids provided");
            return;
        }
        if (validIds.length > BATCH_MAX) {
            fail(res, 400, `Too many ids (max ${BATCH_MAX})`);
            return;
        }

        const videos = await prisma.videos.findMany({ where: { id: { in: validIds } } });
        const formatted = videos.map((v) => ({ ...v, uploaded_at: v.uploaded_at.toISOString() }));
        ok(res, formatted, undefined, `${formatted.length} videos resolved`);
    } catch (err: unknown) {
        logger.error({ err }, "getVideosBatch failed");
        fail(res, 500, "Operation Failed", err);
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
        logger.error({ err });
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
        logger.error({ err });
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
        // Public read URL the file will live at once the PUT completes. Returned
        // so non-video uploaders (e.g. collection cover images) can persist it
        // directly without a second round-trip through createVideo.
        const publicUrl = storageProvider.getPublicUrl(uniqueName);

        ok(res, { signedUrl, fileName: uniqueName, publicUrl }, undefined, "Upload URL generated");
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
            description?: string;
            uploaded_by: { id: string; username: string; avatar_url?: string };
            uploaded_at: Date;
            hashtags: string[];
            thumbnail_url?: string;
            duration?: number;
            width?: number;
            height?: number;
            fps?: number;
            visibility?: "PUBLIC" | "UNLISTED" | "PRIVATE" | "DRAFT";
            software_used?: string[];
        } = metadata;

        const videoData = {
            title: req_data.title,
            description: req_data.description,
            uploaded_by: req_data.uploaded_by,
            uploaded_at: req_data.uploaded_at,
            // Never trust client tags — normalize/dedupe/cap so the feed's
            // hashtag weighting and explore's exact-match search stay consistent.
            hashtags: sanitizeHashtags(req_data.hashtags),
            video_url: publicUrl,
            // NATIVE upload path — embed sources come in through a separate flow.
            source_type: "NATIVE" as const,
            thumbnail_url: req_data.thumbnail_url,
            duration: req_data.duration,
            width: req_data.width,
            height: req_data.height,
            fps: req_data.fps,
            // Client-probed media is stored ONLY as a provisional value for instant
            // UX — it is NOT trusted (spoofable to bypass PRO 4K/60 gating). The row
            // starts UPLOADED; the media-processing worker (ADR 0002) pulls the
            // object, runs ffprobe + a poster extract, and overwrites these fields
            // with trusted values before flipping to READY (or FAILED).
            processing_status: "UPLOADED" as const,
            visibility: req_data.visibility ?? "PUBLIC",
            // Never trust client tags — keep only known-vocab slugs.
            software_used: sanitizeSoftware(req_data.software_used),
        };
        const result = await prisma.videos.create({ data: videoData });

        // Notify other services of the new Kine. user-service increments the
        // uploader's video_count (Creator badge / Top Creator). Fire-and-forget:
        // a publish failure must not fail the upload the user already succeeded at.
        rabbitMQService
            .publish(VIDEO_EXCHANGE, "video.created", {
                videoId: result.id,
                uploaderId: result.uploaded_by.id,
            })
            .catch((err) => logger.error({ err }, "publish video.created failed"));

        // Kick off native media processing (ADR 0002): the ffprobe/thumbnail
        // worker pulls the object off storage and writes trusted duration/
        // width/height/fps + poster, then flips UPLOADED → READY. Fire-and-forget
        // — a publish failure leaves the Kine UPLOADED (retryable), it doesn't
        // fail the upload the user already completed.
        rabbitMQService
            .publish(VIDEO_EXCHANGE, "video.uploaded", {
                videoId: result.id,
                fileName,
            })
            .catch((err) => logger.error({ err }, "publish video.uploaded failed"));

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
                // Notify other services to clean up their soft references to this
                // video (curation removes CollectionItems, marketplace unlinks
                // AssetVideoLinks). Fire-and-forget: a publish failure must not
                // fail the delete the user already succeeded at.
                rabbitMQService
                    .publish(VIDEO_EXCHANGE, "video.deleted", {
                        videoId,
                        uploaderId: result.uploaded_by.id,
                    })
                    .catch((err) => logger.error({ err }, "publish video.deleted failed"));
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

// POST /api/videos/:videoId/view — register a view.
// Deduped per (video, viewer) for a short window via Redis so a single watcher
// re-looping the clip can't inflate the count. viewer = userId when signed in,
// else the client-supplied anonymous id. view_count feeds trending + C-Score
// ("engagement on uploads", roadmap §5), so it must be a real signal, not spam.
const VIEW_DEDUPE_TTL = 60 * 60; // 1h

export const registerView = async (req: Request, res: Response) => {
    try {
        const videoId = req?.params?.videoId;
        if (!videoId || !OBJECT_ID.test(videoId)) {
            fail(res, 400, "Valid Video Id is required");
            return;
        }

        const viewer =
            (req.body?.viewerId as string | undefined) ||
            req.ip ||
            "anon";

        const redisClient = getRedisClient();
        const dedupeKey = `view:${videoId}:${viewer}`;

        let firstView = true;
        try {
            // NX set: only the first viewer in the window wins.
            firstView =
                (await redisClient.set(dedupeKey, "1", {
                    NX: true,
                    EX: VIEW_DEDUPE_TTL,
                })) === "OK";
        } catch (cacheErr) {
            // If Redis is down we still count — better a slightly noisy signal
            // than a lost one. (View inflation risk is bounded by client behavior.)
            logger.error({ err: cacheErr }, "View dedupe cache error");
        }

        if (!firstView) {
            ok(res, { counted: false }, undefined, "View already counted");
            return;
        }

        const updated = await prisma.videos.update({
            where: { id: videoId },
            data: { view_count: { increment: 1 } },
            select: { view_count: true },
        });

        ok(res, { counted: true, view_count: updated.view_count }, undefined, "View registered");
        return;
    } catch (err: unknown) {
        logger.error({ err }, "registerView failed");
        fail(res, 500, "Operation Failed", err);
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
        logger.error({ err });
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
        logger.error({ err });
        fail(res, 500, "Operation Failed", err);
        return;
    }
};