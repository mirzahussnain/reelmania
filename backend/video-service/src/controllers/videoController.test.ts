import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";

// ── Mock the datastore + storage so controllers run with no real infra ──
// vi.mock is hoisted above the file, so the mock object must be too.
const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    like: { findUnique: vi.fn(), findMany: vi.fn(), delete: vi.fn(), create: vi.fn() },
    videos: { findMany: vi.fn(), update: vi.fn() },
    $transaction: vi.fn(),
  },
}));
vi.mock("../utils/dbconnection.config", () => ({ default: prismaMock }));
vi.mock("../utils/redis", () => ({ getRedisClient: vi.fn() }));
vi.mock("../providers/StorageFactory", () => ({ StorageFactory: { getProvider: vi.fn() } }));

import { updateLikes, getUserVideos, getVideosBatch } from "./videoController";

const HEX24 = "a".repeat(24);
const HEX24_B = "b".repeat(24);

const mockRes = () => {
  const res = {} as Response & { body?: unknown };
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockImplementation((b) => { (res as { body?: unknown }).body = b; return res; });
  res.send = vi.fn().mockImplementation((b) => { (res as { body?: unknown }).body = b; return res; });
  return res;
};

beforeEach(() => vi.clearAllMocks());

describe("updateLikes", () => {
  const baseReq = {
    params: { videoId: "v1" },
    body: { userData: { userId: "u1", userName: "alice" } },
  } as unknown as Request;

  it("likes the video when no like exists and returns the success envelope", async () => {
    prismaMock.like.findUnique.mockResolvedValue(null);
    prismaMock.$transaction.mockResolvedValue([{ id: "l1" }, { likeCount: 1 }]);
    prismaMock.like.findMany.mockResolvedValue([{ userId: "u1", username: "alice" }]);

    const res = mockRes();
    await updateLikes(baseReq, res);

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
    const body = (res as { body?: any }).body;
    expect(body.success).toBe(true);
    expect(body.data.videoId).toBe("v1");
    expect(body.data.updatedLikes).toHaveLength(1);
  });

  it("is idempotent: a concurrent duplicate (P2002) is swallowed, not thrown", async () => {
    prismaMock.like.findUnique.mockResolvedValue(null);
    // The competing request already created the like; our create loses with P2002.
    prismaMock.$transaction.mockRejectedValue({ code: "P2002" });
    prismaMock.like.findMany.mockResolvedValue([{ userId: "u1", username: "alice" }]);

    const res = mockRes();
    await updateLikes(baseReq, res);

    // No 500 — the winning request kept the count correct, so we return state.
    expect(res.status).toHaveBeenCalledWith(200);
    const body = (res as { body?: any }).body;
    expect(body.success).toBe(true);
    expect(body.data.updatedLikes).toHaveLength(1);
  });

  it("rejects incomplete input with a 400 envelope", async () => {
    const res = mockRes();
    await updateLikes({ params: { videoId: "v1" }, body: {} } as unknown as Request, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });
});

describe("getVideosBatch", () => {
  it("400s when ids is not an array", async () => {
    const res = mockRes();
    await getVideosBatch({ body: {} } as unknown as Request, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(prismaMock.videos.findMany).not.toHaveBeenCalled();
  });

  it("returns [] without querying when no valid ObjectIds are given", async () => {
    const res = mockRes();
    await getVideosBatch({ body: { ids: ["not-an-id", 123] } } as unknown as Request, res);
    expect(prismaMock.videos.findMany).not.toHaveBeenCalled();
    expect((res as { body?: any }).body.data).toEqual([]);
  });

  it("dedupes + filters to valid ids and returns formatted videos", async () => {
    prismaMock.videos.findMany.mockResolvedValue([
      { id: HEX24, title: "One", uploaded_at: new Date("2024-01-01") },
    ]);
    const res = mockRes();
    await getVideosBatch(
      { body: { ids: [HEX24, HEX24, "bad", HEX24_B] } } as unknown as Request,
      res
    );

    const where = prismaMock.videos.findMany.mock.calls[0][0].where;
    expect(where.id.in).toEqual([HEX24, HEX24_B]); // deduped, malformed dropped
    const body = (res as { body?: any }).body;
    expect(body.success).toBe(true);
    expect(body.data[0].uploaded_at).toBe(new Date("2024-01-01").toISOString());
  });

  it("400s when the batch exceeds the cap", async () => {
    const ids = Array.from({ length: 101 }, (_, i) => i.toString(16).padStart(24, "0"));
    const res = mockRes();
    await getVideosBatch({ body: { ids } } as unknown as Request, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(prismaMock.videos.findMany).not.toHaveBeenCalled();
  });
});

describe("getUserVideos", () => {
  it("paginates with a cursor and reports nextCursor in meta when full page", async () => {
    prismaMock.videos.findMany.mockResolvedValue([
      { id: "a", uploaded_at: new Date("2024-01-01") },
      { id: "b", uploaded_at: new Date("2024-01-02") },
    ]);
    const req = { params: { userId: "u1" }, query: { limit: "2" } } as unknown as Request;
    const res = mockRes();
    await getUserVideos(req, res);

    const body = (res as { body?: any }).body;
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(2);
    expect(body.meta.nextCursor).toBe("b"); // page was full → there may be more
  });

  it("returns nextCursor:null on a partial page", async () => {
    prismaMock.videos.findMany.mockResolvedValue([
      { id: "a", uploaded_at: new Date("2024-01-01") },
    ]);
    const req = { params: { userId: "u1" }, query: { limit: "2" } } as unknown as Request;
    const res = mockRes();
    await getUserVideos(req, res);

    const body = (res as { body?: any }).body;
    expect(body.data).toHaveLength(1);
    expect(body.meta.nextCursor).toBeNull();
  });
});
