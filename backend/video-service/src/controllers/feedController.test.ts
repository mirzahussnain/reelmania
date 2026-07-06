import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";

// getFollowingFeed pulls the follow-set (cached in redis, resolved via userClient
// on miss), queries videos, caps + interleaves. Mock the infra; use the REAL
// interleaveByCreator so ordering is exercised end-to-end.
const { prismaMock, redisMock, authMock, followingMock } = vi.hoisted(() => ({
  prismaMock: { videos: { findMany: vi.fn() } },
  redisMock: { get: vi.fn(), setEx: vi.fn() },
  authMock: vi.fn(),
  followingMock: vi.fn(),
}));
vi.mock("../utils/dbconnection.config", () => ({ default: prismaMock }));
vi.mock("../utils/redis", () => ({ getRedisClient: () => redisMock }));
vi.mock("@clerk/express", () => ({ getAuth: authMock }));
vi.mock("../utils/userClient", () => ({ fetchFollowingIds: followingMock }));

import { getFollowingFeed } from "./feedController";

const mockRes = () => {
  const res = {} as Response & { body?: unknown };
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockImplementation((b) => { (res as { body?: unknown }).body = b; return res; });
  return res;
};

const vid = (id: string, creator: string) => ({
  id,
  uploaded_by: { id: creator },
  uploaded_at: new Date("2024-01-01"),
});

beforeEach(() => {
  vi.clearAllMocks();
  authMock.mockReturnValue({ userId: "me" });
});

describe("getFollowingFeed", () => {
  it("401s when unauthenticated", async () => {
    authMock.mockReturnValueOnce({});
    const res = mockRes();
    await getFollowingFeed({ query: {} } as unknown as Request, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns an empty feed (no query) when the user follows no one", async () => {
    redisMock.get.mockResolvedValue(null);      // cache miss
    followingMock.mockResolvedValue([]);         // resolves to no follows

    const res = mockRes();
    await getFollowingFeed({ query: {} } as unknown as Request, res);

    const body = (res as { body?: any }).body;
    expect(body.data).toEqual([]);
    expect(body.meta.nextCursor).toBeNull();
    expect(prismaMock.videos.findMany).not.toHaveBeenCalled();
    expect(redisMock.setEx).toHaveBeenCalled(); // empty set is cached too
  });

  it("uses the cached follow-set without calling user-service", async () => {
    redisMock.get.mockResolvedValue(JSON.stringify(["a", "b"]));
    prismaMock.videos.findMany.mockResolvedValue([]);

    const res = mockRes();
    await getFollowingFeed({ query: {} } as unknown as Request, res);

    expect(followingMock).not.toHaveBeenCalled();
    const where = prismaMock.videos.findMany.mock.calls[0][0].where;
    expect(where.uploaded_by.is.id.in).toEqual(["a", "b"]);
    // Only published videos surface — PUBLIC and fully processed.
    expect(where.visibility).toBe("PUBLIC");
    expect(where.processing_status).toBe("READY");
  });

  it("caps the $in at FOLLOWING_FANOUT_CAP (1000)", async () => {
    const ids = Array.from({ length: 1001 }, (_, i) => `id${i}`);
    redisMock.get.mockResolvedValue(JSON.stringify(ids));
    prismaMock.videos.findMany.mockResolvedValue([]);

    const res = mockRes();
    await getFollowingFeed({ query: {} } as unknown as Request, res);

    const where = prismaMock.videos.findMany.mock.calls[0][0].where;
    expect(where.uploaded_by.is.id.in).toHaveLength(1000);
  });

  it("interleaves by creator but takes nextCursor from the recency order", async () => {
    redisMock.get.mockResolvedValue(JSON.stringify(["a", "b"]));
    // Recency order: v1(a), v2(a), v3(b). Full page (limit 3) → there may be more.
    prismaMock.videos.findMany.mockResolvedValue([vid("v1", "a"), vid("v2", "a"), vid("v3", "b")]);

    const res = mockRes();
    await getFollowingFeed({ query: { limit: "3" } } as unknown as Request, res);

    const body = (res as { body?: any }).body;
    // Round-robin spreads creator "a": v1, v3(b), v2.
    expect(body.data.map((v: any) => v.id)).toEqual(["v1", "v3", "v2"]);
    // Cursor is the last RECENCY item (v3), not the last delivered (v2).
    expect(body.meta.nextCursor).toBe("v3");
    // Composite sort so ties can't skip/duplicate across pages.
    const orderBy = prismaMock.videos.findMany.mock.calls[0][0].orderBy;
    expect(orderBy).toEqual([{ uploaded_at: "desc" }, { id: "desc" }]);
  });

  it("reports nextCursor:null on a partial page", async () => {
    redisMock.get.mockResolvedValue(JSON.stringify(["a"]));
    prismaMock.videos.findMany.mockResolvedValue([vid("v1", "a")]); // < limit

    const res = mockRes();
    await getFollowingFeed({ query: { limit: "10" } } as unknown as Request, res);

    expect((res as { body?: any }).body.meta.nextCursor).toBeNull();
  });
});
