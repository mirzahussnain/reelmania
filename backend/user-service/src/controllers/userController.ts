import { Request, Response } from "express";

import { PrismaClient } from "@prisma/client";


const prisma=new PrismaClient()

export const getUsers = async (req: Request, res: Response) => {
  try{
    const result=await prisma.users.findMany({})
    if(result.length==0){
      res.status(404).json({message:"No user found."})
      return;
    }
    res.status(200).json({message:"Users found.",users:result})
    return;
  }catch (err){
    res.status(500).json({message:"Something went wrong.",error:err})
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
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Send successful response
    res.status(200).json({ message: "User Found Successfully", body: user });
    return;
  } catch (err: any) {
    // Log the error and send a server error response
   
    res.status(500).json({ message: `User not Found`, error: err.message });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    // Check if the user already exists
   
    const existingUser = await prisma.users.findUnique({
      where: { id: req?.body?.id },
    });

    if (existingUser) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    const ISO_date = new Date(req?.body?.created_at).toISOString();
    const data = { ...req.body, created_at: ISO_date };
    const user = await prisma.users.create({ data });

    res.status(200).json({ message: "User Created Successfully", body: user });
    return;
  } catch (err: any) {
    console.log(err);
    res.status(500).send(`User Creation Failed: ${err}`);
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

    res.status(200).json({ message: "User Updated Successfully", body: result });
    return;
  } catch (err: any) {
    res.status(500).send(`User Updation Failed: ${err}`);
  }
};

export const updateUserRole=async(req:Request,res:Response)=>{
  try{
    const username=req?.params?.username;
    const newRole=req?.body?.newRole
    if(!username){
      res.status(401).send("User name is missing")
      return;
    }
    if(!newRole){
      res.status(401).send("User Role is missing")
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

    res.status(200).send({message:"USER ROLE UPDATED SUCCESSFULLY",data:result})
    return;

  }catch(err){
    res.status(500).send("OPERATION FAILED")
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

    res.status(200).send("User deleted successfully");
    return;
  } catch (err: any) {
    res.status(500).send(`User deletion failed: ${err?.message}`);
  }
};

export const getFollowers=async(req:Request,res:Response)=>{
  try{
    const userId=req?.params?.userId;
    if(!userId){
      res.status(401).send("User Id is missing");
      return;
    }
    const result=await prisma.followers.findMany({
      where:{
        following_id:userId
      }
    })

    res.status(200).send({message:"Followers Fetched Successfully",result})
    return;

  }catch(err){
    res.status(500).json({body:err,message:"Operation Failed"})
    return;
  }
}

export const updateFollower=async (req:Request,res:Response)=>{
  
  try{

    const follower_id:string=req?.body?.followerId;
    const following_id:string=req?.params?.userId;
    if(!follower_id || !following_id){
      res.status(500).send("Follower or Following Id is missing");
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
        res.status(200).send({message:"Unfollowed",result:null})
        return;
      }
      res.status(500).send("Operation Failed")
      return;
    }
    else{

      const result=await prisma.followers.create({data:{
       follower_id,
        following_id
      }})
      if(!result){
        res.status(500).send("Operation Failed!")
        return;
      }
      res.status(200).send({message:"Follower Added Successfully",result})
      return;
    }
  }
  catch(err){
    console.log(err)
    res.status(500).send(err)
  }
}
