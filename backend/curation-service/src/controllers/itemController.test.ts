import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";

const { prismaMock, authMock, publishMock } = vi.hoisted(() => ({
  prismaMock: {
    collection: { findUnique: vi.fn() },
    collectionItem: {
      findFirst: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
      updateMany: vi.fn(),
    },
  },
  authMock: { userId: null as string | null },
  publishMock: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../utils/dbconnection.config", () => ({ default: prismaMock }));
vi.mock("@clerk/express", () => ({ getAuth: () => ({ userId: authMock.userId }) }));
vi.mock("../utils/rabbitmq", () => ({
  CURATION_EXCHANGE: "curation.events",
  rabbitMQService: { publish: publishMock },
}));

import { addItem, removeItem, updateItem } from "./itemController";

const mockRes = () => {
  const res = {} as Response & { body?: unknown };
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockImplementation((b) => {
    (res as { body?: unknown }).body = b;
    return res;
  });
  return res;
};

const ownedBy = (ownerId: string) => ({ id: "c1", ownerId });

beforeEach(() => {
  vi.clearAllMocks();
  authMock.userId = null;
});

describe("addItem", () => {
  it("401s when unauthenticated", async () => {
    const res = mockRes();
    await addItem({ params: { collectionId: "c1" }, body: { videoId: "v1" } } as unknown as Request, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("403s when the collection is owned by someone else", async () => {
    authMock.userId = "user_1";
    prismaMock.collection.findUnique.mockResolvedValue(ownedBy("user_2"));
    const res = mockRes();
    await addItem({ params: { collectionId: "c1" }, body: { videoId: "v1" } } as unknown as Request, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("400s when videoId is missing", async () => {
    authMock.userId = "user_1";
    prismaMock.collection.findUnique.mockResolvedValue(ownedBy("user_1"));
    const res = mockRes();
    await addItem({ params: { collectionId: "c1" }, body: {} } as unknown as Request, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("adds the video, assigns next position, and publishes collection.item.added", async () => {
    authMock.userId = "user_1";
    prismaMock.collection.findUnique.mockResolvedValue(ownedBy("user_1"));
    prismaMock.collectionItem.findFirst.mockResolvedValue({ position: 4 }); // last item
    prismaMock.collectionItem.create.mockImplementation(({ data }: any) => ({ id: "i1", ...data }));
    const res = mockRes();

    await addItem(
      { params: { collectionId: "c1" }, body: { videoId: "v1", note: "great cut" } } as unknown as Request,
      res
    );

    expect(res.status).toHaveBeenCalledWith(201);
    const data = prismaMock.collectionItem.create.mock.calls[0][0].data;
    expect(data.position).toBe(5);
    expect(data.addedById).toBe("user_1");
    expect(publishMock).toHaveBeenCalledWith(
      "curation.events",
      "collection.item.added",
      expect.objectContaining({ collectionId: "c1", videoId: "v1", ownerId: "user_1" })
    );
  });

  it("409s when the video is already in the collection (unique violation)", async () => {
    authMock.userId = "user_1";
    prismaMock.collection.findUnique.mockResolvedValue(ownedBy("user_1"));
    prismaMock.collectionItem.findFirst.mockResolvedValue(null);
    prismaMock.collectionItem.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("dup", { code: "P2002", clientVersion: "6" })
    );
    const res = mockRes();

    await addItem({ params: { collectionId: "c1" }, body: { videoId: "v1" } } as unknown as Request, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(publishMock).not.toHaveBeenCalled();
  });
});

describe("removeItem", () => {
  it("404s when the video is not in the collection", async () => {
    authMock.userId = "user_1";
    prismaMock.collection.findUnique.mockResolvedValue(ownedBy("user_1"));
    prismaMock.collectionItem.deleteMany.mockResolvedValue({ count: 0 });
    const res = mockRes();
    await removeItem({ params: { collectionId: "c1", videoId: "v9" } } as unknown as Request, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(publishMock).not.toHaveBeenCalled();
  });

  it("removes and publishes collection.item.removed", async () => {
    authMock.userId = "user_1";
    prismaMock.collection.findUnique.mockResolvedValue(ownedBy("user_1"));
    prismaMock.collectionItem.deleteMany.mockResolvedValue({ count: 1 });
    const res = mockRes();
    await removeItem({ params: { collectionId: "c1", videoId: "v1" } } as unknown as Request, res);
    expect(publishMock).toHaveBeenCalledWith(
      "curation.events",
      "collection.item.removed",
      expect.objectContaining({ collectionId: "c1", videoId: "v1" })
    );
  });
});

describe("updateItem", () => {
  it("400s when neither note nor position is provided", async () => {
    authMock.userId = "user_1";
    prismaMock.collection.findUnique.mockResolvedValue(ownedBy("user_1"));
    const res = mockRes();
    await updateItem({ params: { collectionId: "c1", videoId: "v1" }, body: {} } as unknown as Request, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("400s when position is not an integer", async () => {
    authMock.userId = "user_1";
    prismaMock.collection.findUnique.mockResolvedValue(ownedBy("user_1"));
    const res = mockRes();
    await updateItem(
      { params: { collectionId: "c1", videoId: "v1" }, body: { position: "abc" } } as unknown as Request,
      res
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("updates note/position for an owned item", async () => {
    authMock.userId = "user_1";
    prismaMock.collection.findUnique.mockResolvedValue(ownedBy("user_1"));
    prismaMock.collectionItem.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.collectionItem.findFirst.mockResolvedValue({ id: "i1", note: "edited", position: 2 });
    const res = mockRes();
    await updateItem(
      { params: { collectionId: "c1", videoId: "v1" }, body: { note: "edited", position: 2 } } as unknown as Request,
      res
    );
    const body = (res as { body?: any }).body;
    expect(body.success).toBe(true);
    expect(body.data).toEqual(expect.objectContaining({ note: "edited", position: 2 }));
  });
});
