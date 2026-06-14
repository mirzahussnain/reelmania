import { Request, Response } from "express";

import prisma from "../utils/dbconnection.config";

export const getUsers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const result = await prisma.users.findMany({
      skip,
      take: limit,
      orderBy: { created_at: "desc" },
    });

    if (result.length === 0) {
      res.status(404).json({ success: false, message: "No user found." });
      return;
    }
    res.status(200).json({ success: true, message: "Users found.", users: result, page, limit });
    return;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ success: false, message: "Something went wrong.", error: errorMsg });
    return;
  }
};

export const getUser = async (req: Request, res: Response) => {
  try {
   
    const userId = req?.params?.userId;
   
    // Fetch the user from the database
    const user = await prisma.users.findUnique({
      where: {
        id: userId,
      },
    });

    // Check if user exists
    if (!user) {
      // Respond with 404 if user is not found
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    // Send successful response
    res.status(200).json({ success: true, message: "User Found Successfully", body: user });
    return;
  } catch (err: unknown) {
    // Log the error and send a server error response
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    console.error(err);
    res.status(500).json({ success: false, message: `User not Found`, error: errorMsg });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    // Check if the user already exists
   
    const existingUser = await prisma.users.findUnique({
      where: { id: req?.body?.id },
    });

    if (existingUser) {
      res.status(400).json({ success: false, message: "User already exists" });
      return;
    }

    const ISO_date = new Date(req?.body?.created_at).toISOString();
    const data = { ...req.body, created_at: ISO_date };
    const user = await prisma.users.create({ data });

    res.status(200).json({ success: true, message: "User Created Successfully", body: user });
    return;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    console.error(err);
    res.status(500).json({ success: false, message: `User Creation Failed`, error: errorMsg });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const targetedUser = req.params.id;
  const ISO_date = new Date(req?.body?.created_at).toISOString();
  const data = { ...req.body, created_at: ISO_date };

  try {
    const result = await prisma.users.update({
      data,
      where: {
        id: targetedUser,
      },
    });

    res.status(200).json({ success: true, message: "User Updated Successfully", body: result });
    return;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ success: false, message: `User Updation Failed`, error: errorMsg });
  }
};

export const updateUserRole=async(req:Request,res:Response)=>{
  try{
    const username=req?.params?.username;
    const newRole=req?.body?.newRole
    if(!username){
      res.status(401).json({ success: false, message: "User name is missing" });
      return;
    }
    if(!newRole){
      res.status(401).json({ success: false, message: "User Role is missing" });
      return;
    }
    const result=await prisma.users.update({
      where:{
        username:username,
      },
      data:{
        role:{
          set:newRole
        }
      }
    })

    res.status(200).json({success: true, message:"USER ROLE UPDATED SUCCESSFULLY",data:result})
    return;

  }catch(err: unknown){
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ success: false, message: "OPERATION FAILED", error: errorMsg });
  }
}
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const targetedId = req.params.id;
    await prisma.users.delete({
      where: {
        id: targetedId,
      },
    });

    res.status(200).json({ success: true, message: "User deleted successfully" });
    return;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ success: false, message: `User deletion failed`, error: errorMsg });
  }
};

export const getFollowers=async(req:Request,res:Response)=>{
  try{
    const userId=req?.params?.userId;
    if(!userId){
      res.status(401).json({ success: false, message: "User Id is missing" });
      return;
    }
    const result=await prisma.followers.findMany({
      where:{
        following_id:userId
      }
    })

    res.status(200).json({ success: true, message:"Followers Fetched Successfully",result})
    return;

  }catch(err: unknown){
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({success: false, message:"Operation Failed", error: errorMsg})
    return;
  }
}

export const updateFollower=async (req:Request,res:Response)=>{
  
  try{

    const follower_id:string=req?.body?.followerId;
    const following_id:string=req?.params?.userId;
    if(!follower_id || !following_id){
      res.status(500).json({ success: false, message: "Follower or Following Id is missing" });
      return;
    }
    const followedBy=await prisma.followers.findUnique({
      where: {
        follower_id_following_id: {
          follower_id: follower_id,
          following_id: following_id
        }
      }
    })
    if(followedBy){
      const result=await prisma.followers.delete({
        where:{
          follower_id_following_id:{
            follower_id:follower_id,
            following_id:following_id
          }
        }
      })
      if(result){
        res.status(200).json({ success: true, message:"Unfollowed",result:null})
        return;
      }
      res.status(500).json({ success: false, message: "Operation Failed" });
      return;
    }
    else{

      const result=await prisma.followers.create({data:{
       follower_id,
        following_id
      }})
      if(!result){
        res.status(500).json({ success: false, message: "Operation Failed!" });
        return;
      }
      res.status(200).json({ success: true, message:"Follower Added Successfully",result})
      return;
    }
  }
  catch(err: unknown){
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    console.error(err)
    res.status(500).json({ success: false, message: "Operation Failed", error: errorMsg })
  }
}
