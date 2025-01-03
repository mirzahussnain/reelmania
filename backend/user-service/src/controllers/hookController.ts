import { Webhook } from "svix";
import { Request, Response } from "express";
import dotenv from "dotenv";
import { userType } from "@/utils/types";
import {
  createUser,
  deleteUser,
  updateUser,
} from "@/controllers/userController";

dotenv.config();
export const userManagement = async (req: Request, res: Response) => {
  const SIGNING_SECRET = process.env.WEBHOOK_SIGNING_SECRET;
  if (!SIGNING_SECRET) {
    throw new Error("Error: No CLERK SIGINING SECRET provided");
  }
  const wh = new Webhook(SIGNING_SECRET);
  // Create new Svix instance with secret

  // Get headers and body

  const headers = req.headers;
  const payload: string = req.body;

  const svix_id = headers["svix-id"];
  const svix_timestamp = headers["svix-timestamp"];
  const svix_signature = headers["svix-signature"];

  // Get Svix headers for verification

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return void res.status(400).json({
      success: false,
      message: "Error: Missing svix headers",
    });
  }

  let evt: any;

  // Attempt to verify the incoming webhook
  // If successful, the payload will be available from 'evt'
  // If verification fails, error out and return error code
  try {
    evt = wh.verify(payload, {
      "svix-id": svix_id as string,
      "svix-timestamp": svix_timestamp as string,
      "svix-signature": svix_signature as string,
    });
  } catch (err: any) {
    console.log("Error: Could not verify webhook:", err.message);
    return void res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  const eventType = evt?.type;
  if (eventType === "user.created" || eventType === "user.updated") {
    const { id, username, first_name, last_name, email_addresses, image_url } =
      evt?.data;
    const userInfo: userType = {
      id,
      username,
      avatar_url: image_url,
      first_name: first_name,
      last_name: last_name,
      email: email_addresses[0]?.email_address,
      created_at: email_addresses[0]?.created_at,
      role: process.env.DEFAULT_USER_ROLE || "Consumer ",
    };
    req.body = userInfo;

    if (eventType === "user.created") {
      await createUser(req,res)
      return;
      
    } else if(eventType==="user.updated") {
      req.params.id = userInfo.id;
      await updateUser(req, res);
      return;
    }
  } 
  else if (eventType === "user.deleted") {
    const { id } = evt?.data;
    req.params.id = id;
    await deleteUser(req, res);
    return;
  }
};
