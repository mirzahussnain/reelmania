import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../utils/dbconnection.config";
import { ok, fail } from "../utils/http";
import { getUserId } from "../middlewares/authMiddleware";
import { slugify, randomSuffix } from "../utils/slug";
import { logger } from "../utils/logger";

/**
 * Generate a slug that is unique for this owner. The base is derived from the
 * title; on a per-owner collision we append a short random suffix and retry a
 * bounded number of times before giving up (avoids an unbounded loop).
 */
const createUniqueSlug = async (ownerId: string, title: string): Promise<string> => {
  const base = slugify(title);
  let candidate = base;
  for (let attempt = 0; attempt < 5; attempt++) {
    const clash = await prisma.collection.findUnique({
      where: { ownerId_slug: { ownerId, slug: candidate } },
    });
    if (!clash) return candidate;
    candidate = `${base}-${randomSuffix()}`;
  }
  // Extremely unlikely; final fallback guarantees uniqueness.
  return `${base}-${Date.now().toString(36)}`;
};

// POST /api/curation/collections — create a collection (authenticated).
export const createCollection = async (req: Request, res: Response) => {
  try {
    const ownerId = getUserId(req);
    if (!ownerId) {
      fail(res, 401, "Authentication required");
      return;
    }

    const { title, description, coverImageUrl, isPrivate } = req.body ?? {};
    if (!title || typeof title !== "string" || !title.trim()) {
      fail(res, 400, "A non-empty title is required");
      return;
    }

    const slug = await createUniqueSlug(ownerId, title);
    const collection = await prisma.collection.create({
      data: {
        ownerId,
        title: title.trim(),
        slug,
        description: description ?? null,
        coverImageUrl: coverImageUrl ?? null,
        // NOTE: isPrivate is a PRO perk; tier lives in marketplace-service.
        // Trust-the-client is intentionally NOT done here — gating is wired when
        // subscription.updated consumption lands (messaging-contract §6).
        isPrivate: Boolean(isPrivate),
      },
    });

    ok(res, collection, undefined, "Collection created", 201);
  } catch (err: unknown) {
    logger.error({ err }, "createCollection failed");
    fail(res, 500, "Could not create collection", err);
  }
};

// GET /api/curation/collections — list collections.
// Default: the caller's own collections (any privacy). With ?ownerId=… : that
// owner's PUBLIC collections only (unless the caller is that owner).
export const listCollections = async (req: Request, res: Response) => {
  try {
    const callerId = getUserId(req);
    const targetOwnerId = (req.query.ownerId as string) || callerId;

    if (!targetOwnerId) {
      fail(res, 400, "ownerId is required when not authenticated");
      return;
    }

    const isOwner = callerId === targetOwnerId;
    const where: Prisma.CollectionWhereInput = {
      ownerId: targetOwnerId,
      ...(isOwner ? {} : { isPrivate: false }),
    };

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [collections, total] = await Promise.all([
      prisma.collection.findMany({
        where,
        include: { _count: { select: { items: true } } },
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.collection.count({ where }),
    ]);

    ok(res, collections, { page, limit, total }, "Collections fetched");
  } catch (err: unknown) {
    logger.error({ err }, "listCollections failed");
    fail(res, 500, "Could not fetch collections", err);
  }
};

// GET /api/curation/collections/owner/:ownerId/slug/:slug — shareable URL.
// Returns metadata + ordered items. Private collections are visible to the owner
// only.
export const getCollectionBySlug = async (req: Request, res: Response) => {
  try {
    const { ownerId, slug } = req.params as Record<string, string>;
    const callerId = getUserId(req);

    const collection = await prisma.collection.findUnique({
      where: { ownerId_slug: { ownerId, slug } },
      include: { items: { orderBy: [{ position: "asc" }, { createdAt: "asc" }] } },
    });

    if (!collection) {
      fail(res, 404, "Collection not found");
      return;
    }
    if (collection.isPrivate && collection.ownerId !== callerId) {
      // Do not reveal existence of a private collection to non-owners.
      fail(res, 404, "Collection not found");
      return;
    }

    ok(res, collection, undefined, "Collection fetched");
  } catch (err: unknown) {
    logger.error({ err }, "getCollectionBySlug failed");
    fail(res, 500, "Could not fetch collection", err);
  }
};

// PUT /api/curation/collections/:id — update metadata (owner-only).
export const updateCollection = async (req: Request, res: Response) => {
  try {
    const ownerId = getUserId(req);
    if (!ownerId) {
      fail(res, 401, "Authentication required");
      return;
    }
    const { id } = req.params as Record<string, string>;

    const existing = await prisma.collection.findUnique({ where: { id } });
    if (!existing) {
      fail(res, 404, "Collection not found");
      return;
    }
    if (existing.ownerId !== ownerId) {
      fail(res, 403, "You can only modify your own collections");
      return;
    }

    const { title, description, coverImageUrl, isPrivate } = req.body ?? {};
    const data: Prisma.CollectionUpdateInput = {};
    if (typeof title === "string" && title.trim()) data.title = title.trim();
    if (description !== undefined) data.description = description;
    if (coverImageUrl !== undefined) data.coverImageUrl = coverImageUrl;
    if (isPrivate !== undefined) data.isPrivate = Boolean(isPrivate);

    const updated = await prisma.collection.update({ where: { id }, data });
    ok(res, updated, undefined, "Collection updated");
  } catch (err: unknown) {
    logger.error({ err }, "updateCollection failed");
    fail(res, 500, "Could not update collection", err);
  }
};

// DELETE /api/curation/collections/:id — delete collection (owner-only).
// Items cascade via the schema relation (onDelete: Cascade).
export const deleteCollection = async (req: Request, res: Response) => {
  try {
    const ownerId = getUserId(req);
    if (!ownerId) {
      fail(res, 401, "Authentication required");
      return;
    }
    const { id } = req.params as Record<string, string>;

    const existing = await prisma.collection.findUnique({ where: { id } });
    if (!existing) {
      fail(res, 404, "Collection not found");
      return;
    }
    if (existing.ownerId !== ownerId) {
      fail(res, 403, "You can only delete your own collections");
      return;
    }

    await prisma.collection.delete({ where: { id } });
    ok(res, null, undefined, "Collection deleted");
  } catch (err: unknown) {
    logger.error({ err }, "deleteCollection failed");
    fail(res, 500, "Could not delete collection", err);
  }
};
