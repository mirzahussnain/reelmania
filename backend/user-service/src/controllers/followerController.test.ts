import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    followers: { findUnique: vi.fn(), findMany: vi.fn(), count: vi.fn(), create: vi.fn(), delete: vi.fn() },
  },
}));
vi.mock("../utils/dbconnection.config", () => ({ default: prismaMock }));

import { checkFollower, getFollowers } from "./followerController";

const mockRes = () => {
  const res = {} as Response & { body?: unknown };
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockImplementation((b) => { (res as { body?: unknown }).body = b; return res; });
  return res;
};

beforeEach(() => vi.clearAllMocks());

describe("checkFollower", () => {
  const req = { params: { userId: "target" }, query: { followerId: "me" } } as unknown as Request;

  it("returns isFollowing:true inside data when a connection exists", async () => {
    prismaMock.followers.findUnique.mockResolvedValue({ follower_id: "me", following_id: "target" });
    const res = mockRes();
    await checkFollower(req, res);
    expect((res as { body?: any }).body).toEqual(
      expect.objectContaining({ success: true, data: { isFollowing: true } })
    );
  });

  it("returns isFollowing:false when there is no connection", async () => {
    prismaMock.followers.findUnique.mockResolvedValue(null);
    const res = mockRes();
    await checkFollower(req, res);
    expect((res as { body?: any }).body.data).toEqual({ isFollowing: false });
  });

  it("400s when an id is missing", async () => {
    const res = mockRes();
    await checkFollower({ params: { userId: "target" }, query: {} } as unknown as Request, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe("getFollowers", () => {
  it("returns followers in data with pagination total in meta", async () => {
    prismaMock.followers.findMany.mockResolvedValue([{ follower_id: "a", following_id: "target" }]);
    prismaMock.followers.count.mockResolvedValue(1);
    const req = { params: { userId: "target" }, query: {} } as unknown as Request;
    const res = mockRes();
    await getFollowers(req, res);

    const body = (res as { body?: any }).body;
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.meta.total).toBe(1);
  });
});
