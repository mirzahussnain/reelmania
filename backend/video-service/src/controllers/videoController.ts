import { connectBlobStorage } from "../utils/blob_connection.config";
import prisma from "../utils/dbconnection.config";
import { v4 as uuidv4 } from "uuid";
import { Request, Response } from "express";
import fs from "fs";

export const getVideos = async (req: Request, res: Response) => {
    try {
        const videos = await prisma.videos.findMany({});

        if (videos.length === 0) {
            res
                .status(200)
                .send({ message: "No Video Exists in Database", videos: null });
            return;
        }
        // Shuffle the videos array for random order
        const shuffledVideos = videos.sort(() => Math.random() - 0.5);


      shuffledVideos.forEach((video)=>{
        video.comments=video.comments.sort((a,b)=>b.posted_at.getTime()-a.posted_at.getTime())
      })

        let formattedDateVideos = shuffledVideos.map((video) => ({
            ...video,
            uploaded_at: video.uploaded_at.toISOString(),
        }
    ));
    
        res
            .status(200)
            .send({ message: "Videos Fetched Successfully", videos: formattedDateVideos });
        return;
    } catch (err: any) {
        res
            .status(500)
            .send(`Operation Failed:${err}`);
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

export const createVideo = async (req: Request, res: Response) => {
    const videoFile = req.file;
    const metadata = JSON.parse(req.body.metadata);
    const filePath = videoFile?.path;
    try {

        if (!metadata) {
            throw new Error("Video Meta-Data is Missing");
        }
        if (!videoFile) {
            throw new Error("Video file is missing");
        }
        if(!filePath){
            throw new Error("File Path is invalid")
        }

        const stream = fs.createReadStream(filePath);
        const azureContainer = connectBlobStorage();
        const userName = metadata?.uploaded_by?.username;
        const blobs = azureContainer.listBlobsFlat();
        let fileExists = false;

        for await (const blob of blobs) {
            if (blob.name.includes(userName) &&
                blob.name.includes(videoFile.originalname)
            ) {
                fileExists = true;
                console.log("File Matched");
                break;
            }
        }

        if (fileExists) {
            if (filePath) {
                try {
                    await fs.promises.unlink(filePath);
                } catch (unlinkError) {
                    console.error('Error deleting temporary file:', unlinkError);
                    // Continue execution even if file deletion fails
                }
            }

            res
                .status(400)
                .send("File with the same name already exists in blob storage.");
            return;
        }

        const uniqueBlobName = `${userName}/${uuidv4()}-${videoFile.originalname}`;
        const blobClient = azureContainer.getBlockBlobClient(uniqueBlobName);
        const uploadBlobResponse = await blobClient.uploadStream(
            stream,
            videoFile.size,
            5
        );

        if (!uploadBlobResponse) {
            throw new Error("Failed to upload video data");
        }

         if (filePath) {
            try {
                await fs.promises.unlink(filePath);
            } catch (unlinkError) {
                console.error('Error deleting temporary file:', unlinkError);
                // Continue execution even if file deletion fails
            }
        }

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

        const videoData = { ...req_data, video_url: blobClient.url };
        const result = await prisma.videos.create({ data: videoData });

        res
            .status(200)
            .send({ message: "Video Created Successfully.", video: result });
        return;
    } catch (err: any) {
        if (filePath) {
            try {
                await fs.promises.unlink(filePath);
            } catch (unlinkError) {
                console.error('Error deleting temporary file:', unlinkError);
                // Continue execution even if file deletion fails
            }
        }
        const statusCode = err.message.includes("exists") ? 400 : 500;
        res.status(statusCode).json({
            error: `Video is not Stored in Database: ${err.message}`
        });
        return;
    }finally{
        if (filePath) {
            try {
                await fs.promises.access(filePath);
                await fs.promises.unlink(filePath);
            } catch {}
        }
    }
};
export const deleteVideo=async(req:Request,res:Response)=>{
    const videoId=req?.params?.videoId;
    try{
        if(!videoId){
            throw new Error("Video Id is missing")
        }
        const result=await prisma.videos.findUnique({
            where:{
                id:videoId
            }
        })
        if(!result){
            throw new Error("Video Does not exist");
        }
        const startIndex=result?.video_url.indexOf("/videos")
        const actualFileName=result?.video_url?.substring(startIndex).replace("/videos/","");
        const azureClient=connectBlobStorage();
        const blobClient=azureClient.getBlobClient(actualFileName)
        const blobResponse=await blobClient.deleteIfExists({
            deleteSnapshots:"include"
        });
        if(blobResponse.succeeded){
            const result=await prisma.videos.delete({
                where:{
                    id:videoId
                }
            })

            
            if(result){
                res.status(200).json({message:"Video Deleted Successfully."})
                return;
            }
        }
        else{
            res.status(500).send(`Video could not be deleted`)
            return;

        }
       
    }catch(err:any){
       
        res.status(500).send({message:`Video could not be deleted: ${err.message}`})
        return;
    }
}

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