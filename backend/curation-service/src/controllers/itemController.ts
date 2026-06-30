import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../utils/dbconnection.config";
import { ok, fail } from "../utils/http";
import { getUserId } from "../middlewares/authMiddleware";
import { rabbitMQService, CURATION_EXCHANGE } from "../utils/rabbitmq";
import { logger } from "../utils/logger";

/**
 * Load a collection and assert the caller owns it. Centralizes the owner-only
 * guard shared by every item mutation. Returns the collection on success, or
 * null after having already written the error response.
 */
const requireOwnedCollection = async (req: Request, res: Response) => {
  const ownerId = getUserId(req);
  if (!ownerId) {
    fail(res, 401, "Authentication required");
    return null;
  }
  const { collectionId } = req.params as Record<string, string>;
  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
  });
  if (!collection) {
    fail(res, 404, "Collection not found");
    return null;
  }
  if (collection.ownerId !== ownerId) {
    fail(res, 403, "You can only modify your own collections");
    return null;
  }
  return collection;
};

// POST /api/curation/collections/:collectionId/items — add a video (owner-only).
// Body: { videoId, note? }. Emits curation.events · collection.item.added so
// marketplace (affiliate context) and the C-Score job can react.
export const addItem = async (req: Request, res: Response) => {
  try {
    const collection = await requireOwnedCollection(req, res);
    if (!collection) return;

    const { videoId, note } = req.body ?? {};
    if (!videoId || typeof videoId !== "string") {
      fail(res, 400, "videoId is required");
      return;
    }

    // Append to the end of the collection by default.
    const last = await prisma.collectionItem.findFirst({
      where: { collectionId: collection.id },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    const position = (last?.position ?? -1) + 1;

    try {
      const item = await prisma.collectionItem.create({
        data: {
          collectionId: collection.id,
          videoId,
          addedById: collection.ownerId, // affiliate attribution anchor
          note: note ?? null,
          position,
        },
      });

      // Fire-and-forget: a publish failure must not fail the user's request.
      rabbitMQService
        .publish(CURATION_EXCHANGE, "collection.item.added", {
          collectionId: collection.id,
          videoId,
          addedById: collection.ownerId,
          ownerId: collection.ownerId,
        })
        .catch((err) => logger.error({ err }, "publish collection.item.added failed"));

      ok(res, item, undefined, "Video added to collection", 201);
    } catch (createErr: unknown) {
      // A video appears at most once per collection (@@unique).
      if (
        createErr instanceof Prisma.PrismaClientKnownRequestError &&
        createErr.code === "P2002"
      ) {
        fail(res, 409, "Video is already in this collection");
        return;
      }
      throw createErr;
    }
  } catch (err: unknown) {
    logger.error({ err }, "addItem failed");
    fail(res, 500, "Could not add video to collection", err);
  }
};

// DELETE /api/curation/collections/:collectionId/items/:videoId — remove (owner-only).
// Emits curation.events · collection.item.removed.
export const removeItem = async (req: Request, res: Response) => {
  try {
    const collection = await requireOwnedCollection(req, res);
    if (!collection) return;
    const { videoId } = req.params as Record<string, string>;

    const result = await prisma.collectionItem.deleteMany({
      where: { collectionId: collection.id, videoId },
    });
    if (result.count === 0) {
      fail(res, 404, "Video is not in this collection");
      return;
    }

    rabbitMQService
      .publish(CURATION_EXCHANGE, "collection.item.removed", {
        collectionId: collection.id,
        videoId,
      })
      .catch((err) => logger.error({ err }, "publish collection.item.removed failed"));

    ok(res, null, undefined, "Video removed from collection");
  } catch (err: unknown) {
    logger.error({ err }, "removeItem failed");
    fail(res, 500, "Could not remove video from collection", err);
  }
};

// PUT /api/curation/collections/:collectionId/items/:videoId — update note/position (owner-only).
export const updateItem = async (req: Request, res: Response) => {
  try {
    const collection = await requireOwnedCollection(req, res);
    if (!collection) return;
    const { videoId } = req.params as Record<string, string>;

    const { note, position } = req.body ?? {};
    const data: Prisma.CollectionItemUpdateInput = {};
    if (note !== undefined) data.note = note;
    if (position !== undefined) {
      const parsed = Number(position);
      if (!Number.isInteger(parsed)) {
        fail(res, 400, "position must be an integer");
        return;
      }
      data.position = parsed;
    }
    if (Object.keys(data).length === 0) {
      fail(res, 400, "Nothing to update (provide note and/or position)");
      return;
    }

    const result = await prisma.collectionItem.updateMany({
      where: { collectionId: collection.id, videoId },
      data,
    });
    if (result.count === 0) {
      fail(res, 404, "Video is not in this collection");
      return;
    }

    const item = await prisma.collectionItem.findFirst({
      where: { collectionId: collection.id, videoId },
    });
    ok(res, item, undefined, "Item updated");
  } catch (err: unknown) {
    logger.error({ err }, "updateItem failed");
    fail(res, 500, "Could not update item", err);
  }
};
