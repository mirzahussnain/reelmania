import { Webhook } from "svix";
import { Request, Response } from "express";
import dotenv from "dotenv";
import { userType } from "@/utils/types";
import { normalizeRole } from "@/constants/roles";
import { rabbitMQService } from "../utils/rabbitmq";
import { logger } from "../utils/logger";

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
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    logger.error({ err: errorMsg }, "Could not verify webhook");
    return void res.status(400).json({
      success: false,
      message: errorMsg,
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
      // Every new user is a Curator by default; Creator is derived once they
      // upload (use the Studio). normalizeRole guards against a bad env value.
      // Single source of truth: src/constants/roles.ts.
      role: normalizeRole(process.env.DEFAULT_USER_ROLE),
    };

    await rabbitMQService.publishToExchange("user_events", {
      eventType,
      data: userInfo,
    });

  } else if (eventType === "user.deleted") {
    const { id } = evt?.data;

    await rabbitMQService.publishToExchange("user_events", {
      eventType,
      data: { id },
    });
  }

  // Instantly return 200 OK to Clerk
  res.status(200).json({ success: true, message: "Webhook received and queued." });
  return;
};
