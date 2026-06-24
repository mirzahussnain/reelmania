import { Request, Response } from "express";

import prisma from "../utils/dbconnection.config";
import { UserService } from "../services/userService";
import { ok, fail } from "../utils/http";
import { logger } from "../utils/logger";

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
      fail(res, 404, "No user found.");
      return;
    }
    ok(res, result, { page, limit }, "Users found.");
    return;
  } catch (err: unknown) {
    fail(res, 500, "Something went wrong.", err);
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
      include: {
        _count: {
          select: {
            followers_followers_following_idTousers: true, // Number of followers
            followers_followers_follower_idTousers: true,  // Number of people they follow
          }
        }
      }
    });

    // Check if user exists
    if (!user) {
      fail(res, 404, "User not found");
      return;
    }

    ok(res, user, undefined, "User Found Successfully");
    return;
  } catch (err: unknown) {
    logger.error({ err });
    fail(res, 500, "User not Found", err);
  }
};


export const getUserByUsername = async (req: Request, res: Response) => {
  try {
    const username = req?.params?.username;
    if (!username) {
      fail(res, 400, "Username is missing");
      return;
    }

    // `username` is @unique (indexed) → O(1) lookup. Replaces the client
    // anti-pattern of downloading all users and filtering by username.
    const user = await prisma.users.findUnique({
      where: { username },
      include: {
        _count: {
          select: {
            followers_followers_following_idTousers: true, // Number of followers
            followers_followers_follower_idTousers: true,  // Number of people they follow
          },
        },
      },
    });

    if (!user) {
      fail(res, 404, "User not found");
      return;
    }

    ok(res, user, undefined, "User Found Successfully");
    return;
  } catch (err: unknown) {
    logger.error({ err });
    fail(res, 500, "User not Found", err);
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const user = await UserService.createUser(req.body);
    ok(res, user, undefined, "User Created Successfully");
    return;
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "User already exists") {
      fail(res, 400, "User already exists");
      return;
    }
    logger.error({ err });
    fail(res, 500, "User Creation Failed", err);
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const targetedUser = req.params.id || req.params.userId;
    const result = await UserService.updateUser(targetedUser, req.body);
    ok(res, result, undefined, "User Updated Successfully");
    return;
  } catch (err: unknown) {
    fail(res, 500, "User Updation Failed", err);
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const username = req?.params?.username;
    const newRole = req?.body?.newRole
    if (!username) {
      fail(res, 401, "User name is missing");
      return;
    }
    if (!newRole) {
      fail(res, 401, "User Role is missing");
      return;
    }
    const result = await prisma.users.update({
      where: {
        username: username,
      },
      data: {
        role: {
          set: newRole
        }
      }
    })

    ok(res, result, undefined, "USER ROLE UPDATED SUCCESSFULLY");
    return;

  } catch (err: unknown) {
    fail(res, 500, "OPERATION FAILED", err);
  }
}
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const targetedId = req.params.id || req.params.userId;
    await UserService.deleteUser(targetedId);
    ok(res, null, undefined, "User deleted successfully");
    return;
  } catch (err: unknown) {
    fail(res, 500, "User deletion failed", err);
  }
};
