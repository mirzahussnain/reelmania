import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    users: { findMany: vi.fn(), findUnique: vi.fn() },
  },
}));
vi.mock("../utils/dbconnection.config", () => ({ default: prismaMock }));
// userController also pulls in UserService (which imports rabbitmq); stub it out.
vi.mock("../services/userService", () => ({ UserService: {} }));

import { getUsers, getUserByUsername } from "./userController";

const mockRes = () => {
  const res = {} as Response & { body?: unknown };
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockImplementation((b) => { (res as { body?: unknown }).body = b; return res; });
  return res;
};

beforeEach(() => vi.clearAllMocks());

describe("getUsers", () => {
  it("returns the paginated user list with meta", async () => {
    prismaMock.users.findMany.mockResolvedValue([{ id: "u1" }, { id: "u2" }]);
    const req = { query: { page: "1", limit: "20" } } as unknown as Request;
    const res = mockRes();
    await getUsers(req, res);

    const body = (res as { body?: any }).body;
    expect(res.status).toHaveBeenCalledWith(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(2);
    expect(body.meta).toEqual({ page: 1, limit: 20 });
  });

  it("404s with the fail envelope when there are no users", async () => {
    prismaMock.users.findMany.mockResolvedValue([]);
    const res = mockRes();
    await getUsers({ query: {} } as unknown as Request, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect((res as { body?: any }).body).toEqual({ success: false, message: "No user found.", data: null });
  });
});

describe("getUserByUsername", () => {
  it("does an O(1) findUnique by username and returns the profile in data", async () => {
    prismaMock.users.findUnique.mockResolvedValue({ id: "u1", username: "alice", _count: {} });
    const req = { params: { username: "alice" } } as unknown as Request;
    const res = mockRes();
    await getUserByUsername(req, res);

    expect(prismaMock.users.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { username: "alice" } })
    );
    const body = (res as { body?: any }).body;
    expect(body.success).toBe(true);
    expect(body.data.username).toBe("alice");
  });

  it("400s when username is missing", async () => {
    const res = mockRes();
    await getUserByUsername({ params: {} } as unknown as Request, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(prismaMock.users.findUnique).not.toHaveBeenCalled();
  });

  it("404s when the user does not exist", async () => {
    prismaMock.users.findUnique.mockResolvedValue(null);
    const res = mockRes();
    await getUserByUsername({ params: { username: "ghost" } } as unknown as Request, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
