import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";

const { prismaMock, rabbitMock } = vi.hoisted(() => ({
  prismaMock: {
    followers: { findUnique: vi.fn(), findMany: vi.fn(), count: vi.fn(), create: vi.fn(), delete: vi.fn() },
  },
  rabbitMock: { publishToExchange: vi.fn().mockResolvedValue(undefined) },
}));
vi.mock("../utils/dbconnection.config", () => ({ default: prismaMock }));
vi.mock("../utils/rabbitmq", () => ({ rabbitMQService: rabbitMock }));

import { checkFollower, getFollowers, getFollowing, getFollowingIds, updateFollower } from "./followerController";

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

  it("flags a follower the owner follows back as isMutual", async () => {
    // Page query returns one follower node "a".
    prismaMock.followers.findMany
      .mockResolvedValueOnce([
        { follower_id: "a", following_id: "me", users_followers_follower_idTousers: { id: "a", username: "a" } },
      ])
      // mutualIdSet: owner "me" follows "a" back (follower_id=me, following_id=a).
      .mockResolvedValueOnce([{ follower_id: "me", following_id: "a" }]);
    prismaMock.followers.count.mockResolvedValue(1);

    const req = { params: { userId: "me" }, query: {} } as unknown as Request;
    const res = mockRes();
    await getFollowers(req, res);

    const node = (res as { body?: any }).body.data[0].users_followers_follower_idTousers;
    expect(node.isMutual).toBe(true);
  });
});

describe("getFollowing", () => {
  it("returns the followed nodes and marks reciprocated ones In Sync", async () => {
    prismaMock.followers.findMany
      // Page query: "me" follows "a".
      .mockResolvedValueOnce([
        { follower_id: "me", following_id: "a", users_followers_following_idTousers: { id: "a", username: "a" } },
      ])
      // mutualIdSet ("following" page): "a" follows "me" back → mutual.
      .mockResolvedValueOnce([{ follower_id: "a", following_id: "me" }]);
    prismaMock.followers.count.mockResolvedValue(1);

    const req = { params: { userId: "me" }, query: {} } as unknown as Request;
    const res = mockRes();
    await getFollowing(req, res);

    const body = (res as { body?: any }).body;
    expect(body.success).toBe(true);
    expect(body.data[0].users_followers_following_idTousers.isMutual).toBe(true);
  });

  it("leaves a one-way follow as not mutual", async () => {
    prismaMock.followers.findMany
      .mockResolvedValueOnce([
        { follower_id: "me", following_id: "b", users_followers_following_idTousers: { id: "b", username: "b" } },
      ])
      .mockResolvedValueOnce([]); // nobody follows back
    prismaMock.followers.count.mockResolvedValue(1);

    const req = { params: { userId: "me" }, query: {} } as unknown as Request;
    const res = mockRes();
    await getFollowing(req, res);

    expect((res as { body?: any }).body.data[0].users_followers_following_idTousers.isMutual).toBe(false);
  });
});

describe("getFollowingIds", () => {
  it("returns a flat array of the ids the user follows", async () => {
    prismaMock.followers.findMany.mockResolvedValue([{ following_id: "a" }, { following_id: "b" }]);
    const req = { params: { userId: "me" }, query: {} } as unknown as Request;
    const res = mockRes();
    await getFollowingIds(req, res);

    expect((res as { body?: any }).body.data).toEqual(["a", "b"]);
  });
});

describe("updateFollower", () => {
  it("creates the edge and emits follow.changed for the follower", async () => {
    prismaMock.followers.create.mockResolvedValue({ follower_id: "me", following_id: "target" });
    const req = { params: { userId: "target" }, body: { followerId: "me" } } as unknown as Request;
    const res = mockRes();
    await updateFollower(req, res);

    expect(rabbitMock.publishToExchange).toHaveBeenCalledWith(
      "user_events",
      expect.objectContaining({ eventType: "follow.changed", data: { followerId: "me" } })
    );
    expect((res as { body?: any }).body.message).toMatch(/Added/);
  });

  it("unfollows on a duplicate (P2002) and still emits follow.changed", async () => {
    prismaMock.followers.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("dup", { code: "P2002", clientVersion: "x" })
    );
    prismaMock.followers.delete.mockResolvedValue({});
    const req = { params: { userId: "target" }, body: { followerId: "me" } } as unknown as Request;
    const res = mockRes();
    await updateFollower(req, res);

    expect(prismaMock.followers.delete).toHaveBeenCalled();
    expect(rabbitMock.publishToExchange).toHaveBeenCalledWith(
      "user_events",
      expect.objectContaining({ eventType: "follow.changed" })
    );
    expect((res as { body?: any }).body.message).toBe("Unfollowed");
  });
});
