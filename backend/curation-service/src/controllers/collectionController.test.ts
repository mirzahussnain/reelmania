import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";

const { prismaMock, authMock } = vi.hoisted(() => ({
  prismaMock: {
    collection: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
  authMock: { userId: null as string | null },
}));
vi.mock("../utils/dbconnection.config", () => ({ default: prismaMock }));
vi.mock("@clerk/express", () => ({ getAuth: () => ({ userId: authMock.userId }) }));

import {
  createCollection,
  listCollections,
  getCollectionBySlug,
  updateCollection,
  deleteCollection,
} from "./collectionController";

const mockRes = () => {
  const res = {} as Response & { body?: unknown };
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockImplementation((b) => {
    (res as { body?: unknown }).body = b;
    return res;
  });
  return res;
};

beforeEach(() => {
  vi.clearAllMocks();
  authMock.userId = null;
});

describe("createCollection", () => {
  it("401s when unauthenticated", async () => {
    const res = mockRes();
    await createCollection({ body: { title: "My Vault" } } as Request, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("400s when the title is missing/blank", async () => {
    authMock.userId = "user_1";
    const res = mockRes();
    await createCollection({ body: { title: "   " } } as Request, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("creates with a slug derived from the title", async () => {
    authMock.userId = "user_1";
    prismaMock.collection.findUnique.mockResolvedValue(null); // slug is free
    prismaMock.collection.create.mockImplementation(({ data }: any) => ({ id: "c1", ...data }));
    const res = mockRes();

    await createCollection({ body: { title: "My Cool Vault!" } } as Request, res);

    expect(res.status).toHaveBeenCalledWith(201);
    const created = prismaMock.collection.create.mock.calls[0][0].data;
    expect(created.slug).toBe("my-cool-vault");
    expect(created.ownerId).toBe("user_1");
  });

  it("appends a suffix when the slug already exists for the owner", async () => {
    authMock.userId = "user_1";
    // First slug check collides, second candidate is free.
    prismaMock.collection.findUnique
      .mockResolvedValueOnce({ id: "existing" })
      .mockResolvedValueOnce(null);
    prismaMock.collection.create.mockImplementation(({ data }: any) => ({ id: "c2", ...data }));
    const res = mockRes();

    await createCollection({ body: { title: "Duplicate" } } as Request, res);

    const created = prismaMock.collection.create.mock.calls[0][0].data;
    expect(created.slug).not.toBe("duplicate");
    expect(created.slug.startsWith("duplicate-")).toBe(true);
  });
});

describe("listCollections", () => {
  it("includes private collections when listing your own", async () => {
    authMock.userId = "user_1";
    prismaMock.collection.findMany.mockResolvedValue([]);
    prismaMock.collection.count.mockResolvedValue(0);
    const res = mockRes();

    await listCollections({ query: {} } as unknown as Request, res);

    const where = prismaMock.collection.findMany.mock.calls[0][0].where;
    expect(where).toEqual({ ownerId: "user_1" }); // no isPrivate filter
  });

  it("restricts to public when listing another owner", async () => {
    authMock.userId = "user_1";
    prismaMock.collection.findMany.mockResolvedValue([]);
    prismaMock.collection.count.mockResolvedValue(0);
    const res = mockRes();

    await listCollections({ query: { ownerId: "user_2" } } as unknown as Request, res);

    const where = prismaMock.collection.findMany.mock.calls[0][0].where;
    expect(where).toEqual({ ownerId: "user_2", isPrivate: false });
  });

  it("400s when anonymous and no ownerId is given", async () => {
    const res = mockRes();
    await listCollections({ query: {} } as unknown as Request, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe("getCollectionBySlug", () => {
  const req = (userId: string | null) => {
    authMock.userId = userId;
    return { params: { ownerId: "user_2", slug: "vault" } } as unknown as Request;
  };

  it("404s when not found", async () => {
    prismaMock.collection.findUnique.mockResolvedValue(null);
    const res = mockRes();
    await getCollectionBySlug(req(null), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("hides a private collection from a non-owner (404, not 403)", async () => {
    prismaMock.collection.findUnique.mockResolvedValue({
      id: "c1",
      ownerId: "user_2",
      isPrivate: true,
      items: [],
    });
    const res = mockRes();
    await getCollectionBySlug(req("user_1"), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("returns a private collection to its owner", async () => {
    prismaMock.collection.findUnique.mockResolvedValue({
      id: "c1",
      ownerId: "user_2",
      isPrivate: true,
      items: [],
    });
    const res = mockRes();
    await getCollectionBySlug(req("user_2"), res);
    expect((res as { body?: any }).body).toEqual(
      expect.objectContaining({ success: true, data: expect.objectContaining({ id: "c1" }) })
    );
  });
});

describe("updateCollection / deleteCollection", () => {
  it("403s when updating a collection you do not own", async () => {
    authMock.userId = "user_1";
    prismaMock.collection.findUnique.mockResolvedValue({ id: "c1", ownerId: "user_2" });
    const res = mockRes();
    await updateCollection({ params: { id: "c1" }, body: { title: "x" } } as unknown as Request, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(prismaMock.collection.update).not.toHaveBeenCalled();
  });

  it("403s when deleting a collection you do not own", async () => {
    authMock.userId = "user_1";
    prismaMock.collection.findUnique.mockResolvedValue({ id: "c1", ownerId: "user_2" });
    const res = mockRes();
    await deleteCollection({ params: { id: "c1" } } as unknown as Request, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(prismaMock.collection.delete).not.toHaveBeenCalled();
  });
});
