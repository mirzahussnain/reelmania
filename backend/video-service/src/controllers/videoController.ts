import prisma from "../utils/dbconnection.config";
import { v4 as uuidv4 } from "uuid";
import { Request, Response } from "express";
import { StorageFactory } from "../providers/StorageFactory";

export const getVideos = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const videos = await prisma.videos.findMany({
            skip,
            take: limit,
            orderBy: { uploaded_at: "desc" },
        });

        if (videos.length === 0) {
            res
                .status(200)
                .send({ message: "No Video Exists in Database", videos: null });
            return;
        }

      // Sort comments for each video
      videos.forEach((video)=>{
        video.comments = video.comments.sort((a,b)=>b.posted_at.getTime()-a.posted_at.getTime());
      });

        let formattedDateVideos = videos.map((video) => ({
            ...video,
            uploaded_at: video.uploaded_at.toISOString(),
        }
    ));
    
        res
            .status(200)
            .send({ message: "Videos Fetched Successfully", videos: formattedDateVideos, page, limit });
        return;
    } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        res
            .status(500)
            .send(`Operation Failed:${errorMsg}`);
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
        const videos = await prisma.videos.findMany({
            where: {
                uploaded_by: {
                    is: {
                        id: uploaderId,
                    },
                },
            },
        });

        if (videos.length === 0) {
            res
                .status(200)
                .send({ message: "User Hasn't Uploaded Any Video Yet", videos: null });
            return;
        }

        const formattedDateVideos = videos.map((video) => ({
            ...video,
            uploaded_at: video.uploaded_at.toISOString(),
        }));

        res
            .status(200)
            .send({ message: `${videos.length} videos found`, videos: formattedDateVideos });
        return;
    } catch (err: any) {
        res
            .status(500)
            .send(`Operation Failed:${err}`);
        return;
    }
};

export const getLikesByVideoId = async (req: Request, res: Response) => {
    try{
        const videoId=req?.params?.videoId;
        if(!videoId){
            res.status(400).send("Video Id is missing")
            return;
        }
        const result=await prisma.videos.findUnique({
            where:{
                id:videoId
            },
            select:{
                Likes:true
            }
        })
        if(!result){
            res.status(404).send("Video Not Found")
            return;
        }
        res.status(200).send({message:"Likes Fetched Successfully",likes:result?.Likes})
        return;

    }catch(err:any){
        res.status(500).send(`Operation Failed:${err}`)
        console.log(err)
        return;
    }
}

export const getCommentsByVideoId = async (req: Request, res: Response) => {
    try{
        const videoId=req?.params?.videoId;
        if(!videoId){
            res.status(400).send("Video Id is missing")
            return;
        }
        const result=await prisma.videos.findUnique({
            where:{
                id:videoId
            },
            select:{
                comments:true
            }
        })
        if(!result){
            res.status(404).send("Video Not Found")
            return;
        }
        res.status(200).send({message:"Comments Fetched Successfully",comments:result?.comments})
        return;
    }catch(err:any){
        res.status(500).send(`Operation Failed:${err}`)
        console.log(err)
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
    const metadata = req.body.metadata ? JSON.parse(req.body.metadata) : req.body;
    const fileName = req.body.fileName;

    try {
        if (!metadata || !fileName) {
            throw new Error("Video Meta-Data or fileName is Missing");
        }

        const storageProvider = StorageFactory.getProvider();
        const publicUrl = storageProvider.getPublicUrl(fileName);

        const req_data: {
            title: string;
            uploaded_by: { id: string; username: string };
            uploaded_at: Date;
            likes: [{ liked_by: string }];
            comments: [{
                author: {
                    id: string;
                    username: string;
                    avatar_url: string
                };
                posted_at: Date;
                text: string
            }];
            hashtags: string[];
        } = metadata;

        const videoData = { ...req_data, video_url: publicUrl };
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
        if (!videoId) {
            throw new Error("Video Id is missing");
        }
        if (!newComment) {
            throw new Error("Comment is missing");
        }

        const result = await prisma.videos.update({
            where: {
                id: videoId
            },
            data: {
                comments: {
                    push: newComment,
                }
            },
            include: {
                comments: true
            }
        });
        // Emit socket event for new comment
        res
            .status(200)
            .send({ message: "Comment Posted Successfully", newVideos: result,videoId:videoId,newComments:result.comments[result?.comments.length-1]});
        return;
    } catch (err: any) {
        console.error(err);
        res
            .status(500)
            .send(`Operation Failed:${err}`);
        return;
    }
};

export const updateLikes = async (req: Request, res: Response) => {
    const videoId = req.params.videoId;
    const userData: { userId: string, userName: string } = req.body.userData;

    try {
        if (!videoId) {
            throw new Error("Video ID is required");
        }
        if (!userData?.userId || !userData?.userName) {
            throw new Error("User data is incomplete");
        }

        const video = await prisma.videos.findUnique({
            where: { id: videoId },
            select: {
                Likes: true
            }
        });

        if (!video) {
            res
                .status(404)
                .send({ message: "Video not found" });
            return;
        }

        const hasLiked = video.Likes?.some(like =>
            like.liked_by?.id === userData.userId
        );

        let result;
        if (hasLiked) {
            result = await prisma.videos.update({
                where: { id: videoId },
                data: {
                    Likes: {
                        set: video.Likes.filter(like =>
                            like.liked_by?.id !== userData.userId
                        )
                    }
                }
            });
        } else {
            result = await prisma.videos.update({
                where: { id: videoId },
                data: {
                    Likes: {
                        push: {
                            liked_by: {
                                id: userData.userId,
                                username: userData.userName
                            }
                        }
                    }
                }
            });
        }
     
        res
            .status(200)
            .send({
                message: hasLiked ? "Like removed successfully" : "Like added successfully",
                video: result,
                updatedLikes: result.Likes,
                videoId:videoId
            });
        return;
    } catch (err: any) {
        console.error('Error updating likes:', err);
        res
            .status(500)
            .send(`Operation Failed:${err}`);
        return;
    }
};