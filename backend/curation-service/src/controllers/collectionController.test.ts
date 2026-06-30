import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";

const { prismaMock, authMock, videoMapMock } = vi.hoisted(() => ({
  prismaMock: {
    collection: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    collectionItem: { findMany: vi.fn() },
  },
  authMock: { userId: null as string | null },
  videoMapMock: { map: new Map<string, unknown>() },
}));
vi.mock("../utils/dbconnection.config", () => ({ default: prismaMock }));
vi.mock("@clerk/express", () => ({ getAuth: () => ({ userId: authMock.userId }) }));
// Hydration is fail-soft and tested separately; default to the configurable map.
vi.mock("../utils/videoClient", () => ({
  fetchVideosByIds: vi.fn(async () => videoMapMock.map),
}));
const coverMock = vi.hoisted(() => ({
  presignCoverUpload: vi.fn(async () => ({ signedUrl: "s", fileName: "f", publicUrl: "p" })),
  deleteCoverByUrl: vi.fn(),
}));
vi.mock("../utils/coverStorage", () => coverMock);

import {
  createCollection,
  listCollections,
  getCollectionBySlug,
  getCuratedIds,
  getCoverUploadUrl,
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
  videoMapMock.map = new Map();
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

describe("listCollections previews", () => {
  it("embeds hydrated preview videos and strips raw items", async () => {
    authMock.userId = "user_1";
    prismaMock.collection.findMany.mockResolvedValue([
      { id: "c1", ownerId: "user_1", items: [{ videoId: "v1" }, { videoId: "v2" }] },
    ]);
    prismaMock.collection.count.mockResolvedValue(1);
    videoMapMock.map = new Map([["v1", { id: "v1", title: "One" }]]); // v2 missing/orphan
    const res = mockRes();

    await listCollections({ query: {} } as unknown as Request, res);

    const data = (res as { body?: any }).body.data;
    expect(data[0].previews).toEqual([{ id: "v1", title: "One" }]); // missing v2 dropped
    expect(data[0].items).toBeUndefined(); // raw items not leaked
  });

  it("adds containsVideo per collection when ?containsVideoId is given", async () => {
    authMock.userId = "user_1";
    prismaMock.collection.findMany.mockResolvedValue([
      { id: "c1", ownerId: "user_1", items: [] },
      { id: "c2", ownerId: "user_1", items: [] },
    ]);
    prismaMock.collection.count.mockResolvedValue(2);
    prismaMock.collectionItem.findMany.mockResolvedValue([{ collectionId: "c1" }]);
    const res = mockRes();

    await listCollections({ query: { containsVideoId: "v1" } } as unknown as Request, res);

    const data = (res as { body?: any }).body.data;
    expect(data.find((c: any) => c.id === "c1").containsVideo).toBe(true);
    expect(data.find((c: any) => c.id === "c2").containsVideo).toBe(false);
  });
});

describe("getCollectionBySlug hydration", () => {
  it("attaches video details per item, null for orphans", async () => {
    prismaMock.collection.findUnique.mockResolvedValue({
      id: "c1",
      ownerId: "user_2",
      isPrivate: false,
      items: [{ videoId: "v1" }, { videoId: "gone" }],
    });
    videoMapMock.map = new Map([["v1", { id: "v1", title: "One" }]]);
    const res = mockRes();

    await getCollectionBySlug(
      { params: { ownerId: "user_2", slug: "vault" } } as unknown as Request,
      res
    );

    const items = (res as { body?: any }).body.data.items;
    expect(items[0].video).toEqual({ id: "v1", title: "One" });
    expect(items[1].video).toBeNull();
  });
});

describe("getCuratedIds", () => {
  it("401s when unauthenticated", async () => {
    const res = mockRes();
    await getCuratedIds({} as Request, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns a flat distinct array of curated videoIds", async () => {
    authMock.userId = "user_1";
    prismaMock.collectionItem.findMany.mockResolvedValue([{ videoId: "v1" }, { videoId: "v2" }]);
    const res = mockRes();
    await getCuratedIds({} as Request, res);

    const args = prismaMock.collectionItem.findMany.mock.calls[0][0];
    expect(args).toEqual(
      expect.objectContaining({ where: { addedById: "user_1" }, distinct: ["videoId"] })
    );
    expect((res as { body?: any }).body.data).toEqual(["v1", "v2"]);
  });
});

describe("getCoverUploadUrl", () => {
  it("401s when unauthenticated", async () => {
    const res = mockRes();
    await getCoverUploadUrl({ body: { fileName: "a.png", contentType: "image/png" } } as Request, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("400s on a non-image content type", async () => {
    authMock.userId = "user_1";
    const res = mockRes();
    await getCoverUploadUrl({ body: { fileName: "a.mp4", contentType: "video/mp4" } } as Request, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(coverMock.presignCoverUpload).not.toHaveBeenCalled();
  });

  it("returns a presigned cover upload for an image", async () => {
    authMock.userId = "user_1";
    const res = mockRes();
    await getCoverUploadUrl({ body: { fileName: "a.png", contentType: "image/png" } } as Request, res);
    expect(coverMock.presignCoverUpload).toHaveBeenCalledWith("a.png", "image/png");
    expect((res as { body?: any }).body.data).toEqual({ signedUrl: "s", fileName: "f", publicUrl: "p" });
  });
});

describe("cover cleanup", () => {
  it("deletes the old cover object when the cover is replaced", async () => {
    authMock.userId = "user_1";
    prismaMock.collection.findUnique.mockResolvedValue({ id: "c1", ownerId: "user_1", coverImageUrl: "old-url" });
    prismaMock.collection.update.mockResolvedValue({ id: "c1", coverImageUrl: "new-url" });
    const res = mockRes();

    await updateCollection(
      { params: { id: "c1" }, body: { coverImageUrl: "new-url" } } as unknown as Request,
      res
    );

    expect(coverMock.deleteCoverByUrl).toHaveBeenCalledWith("old-url");
  });

  it("does not delete when the cover is unchanged", async () => {
    authMock.userId = "user_1";
    prismaMock.collection.findUnique.mockResolvedValue({ id: "c1", ownerId: "user_1", coverImageUrl: "same" });
    prismaMock.collection.update.mockResolvedValue({ id: "c1", coverImageUrl: "same" });
    const res = mockRes();

    await updateCollection(
      { params: { id: "c1" }, body: { coverImageUrl: "same" } } as unknown as Request,
      res
    );

    expect(coverMock.deleteCoverByUrl).not.toHaveBeenCalled();
  });

  it("deletes the cover object when the collection is deleted", async () => {
    authMock.userId = "user_1";
    prismaMock.collection.findUnique.mockResolvedValue({ id: "c1", ownerId: "user_1", coverImageUrl: "old-url" });
    prismaMock.collection.delete.mockResolvedValue({ id: "c1" });
    const res = mockRes();

    await deleteCollection({ params: { id: "c1" } } as unknown as Request, res);

    expect(coverMock.deleteCoverByUrl).toHaveBeenCalledWith("old-url");
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
