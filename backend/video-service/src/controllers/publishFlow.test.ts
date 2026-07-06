import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";

// Infra mocks — no real DB / cache / broker. parseEmbedUrl stays REAL (pure);
// only the network fetch (fetchEmbedMeta) is stubbed.
const { prismaMock, redisMock, publishMock, fetchMetaMock } = vi.hoisted(() => ({
  prismaMock: {
    videos: { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
  },
  redisMock: { keys: vi.fn().mockResolvedValue([]), del: vi.fn() },
  publishMock: vi.fn().mockResolvedValue(undefined),
  fetchMetaMock: vi.fn(),
}));
vi.mock("../utils/dbconnection.config", () => ({ default: prismaMock }));
vi.mock("../utils/redis", () => ({ getRedisClient: () => redisMock }));
vi.mock("../utils/rabbitmq", () => ({
  rabbitMQService: { publish: publishMock },
  VIDEO_EXCHANGE: "video.events",
}));
vi.mock("../utils/embedProviders", async (importActual) => {
  const actual = await importActual<typeof import("../utils/embedProviders")>();
  return { ...actual, fetchEmbedMeta: fetchMetaMock };
});

import { publishVideo, importVideo, updateVideoMetadata } from "./videoController";

const OID = "a".repeat(24);
const mockRes = () => {
  const res = {} as Response & { body?: unknown };
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockImplementation((b) => { (res as { body?: unknown }).body = b; return res; });
  return res;
};

beforeEach(() => vi.clearAllMocks());

describe("publishVideo", () => {
  it("400s when the draft has no category", async () => {
    prismaMock.videos.findUnique.mockResolvedValue({
      id: OID, visibility: "DRAFT", category: null, processing_status: "READY",
    });
    const res = mockRes();
    await publishVideo({ params: { videoId: OID } } as unknown as Request, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(prismaMock.videos.update).not.toHaveBeenCalled();
  });

  it("409s when native media is still processing", async () => {
    prismaMock.videos.findUnique.mockResolvedValue({
      id: OID, visibility: "DRAFT", category: "vfx_compositing", processing_status: "PROCESSING",
    });
    const res = mockRes();
    await publishVideo({ params: { videoId: OID } } as unknown as Request, res);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(prismaMock.videos.update).not.toHaveBeenCalled();
  });

  it("publishes a READY, categorized draft and emits video.created", async () => {
    prismaMock.videos.findUnique.mockResolvedValue({
      id: OID, visibility: "DRAFT", category: "vfx_compositing", processing_status: "READY",
    });
    prismaMock.videos.update.mockResolvedValue({
      id: OID, visibility: "PUBLIC", uploaded_by: { id: "u1" },
    });
    const res = mockRes();
    await publishVideo({ params: { videoId: OID } } as unknown as Request, res);

    expect(prismaMock.videos.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { visibility: "PUBLIC" } })
    );
    expect(publishMock).toHaveBeenCalledWith("video.events", "video.created", expect.any(Object));
    expect((res as { body?: any }).body.data.visibility).toBe("PUBLIC");
  });

  it("is idempotent when already public (no update, no event)", async () => {
    prismaMock.videos.findUnique.mockResolvedValue({ id: OID, visibility: "PUBLIC" });
    const res = mockRes();
    await publishVideo({ params: { videoId: OID } } as unknown as Request, res);
    expect(prismaMock.videos.update).not.toHaveBeenCalled();
    expect(publishMock).not.toHaveBeenCalled();
  });
});

describe("importVideo", () => {
  const uploader = { id: "u1", username: "alice" };

  it("400s on an unrecognized URL", async () => {
    const res = mockRes();
    await importVideo(
      { body: { url: "https://example.com/x", uploaded_by: uploader } } as unknown as Request,
      res
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(prismaMock.videos.create).not.toHaveBeenCalled();
  });

  it("409s when the same provider video was already imported", async () => {
    prismaMock.videos.findFirst.mockResolvedValue({ id: OID });
    const res = mockRes();
    await importVideo(
      { body: { url: "https://youtu.be/dQw4w9WgXcQ", uploaded_by: uploader } } as unknown as Request,
      res
    );
    expect(res.status).toHaveBeenCalledWith(409);
    expect(prismaMock.videos.create).not.toHaveBeenCalled();
  });

  it("creates a DRAFT embed row enriched via oEmbed", async () => {
    prismaMock.videos.findFirst.mockResolvedValue(null);
    fetchMetaMock.mockResolvedValue({ title: "Cool clip", thumbnail_url: "http://t/x.jpg" });
    prismaMock.videos.create.mockImplementation(({ data }: any) => ({ id: OID, ...data }));

    const res = mockRes();
    await importVideo(
      { body: { url: "https://youtu.be/dQw4w9WgXcQ", uploaded_by: uploader } } as unknown as Request,
      res
    );

    const data = prismaMock.videos.create.mock.calls[0][0].data;
    expect(data.source_type).toBe("YOUTUBE");
    expect(data.embed_id).toBe("dQw4w9WgXcQ");
    expect(data.visibility).toBe("DRAFT");
    expect(data.processing_status).toBe("READY");
    expect(data.title).toBe("Cool clip");
  });
});

describe("updateVideoMetadata", () => {
  it("rejects setting visibility PUBLIC (must go through /publish)", async () => {
    const res = mockRes();
    await updateVideoMetadata(
      { params: { videoId: OID }, body: { visibility: "PUBLIC" } } as unknown as Request,
      res
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(prismaMock.videos.update).not.toHaveBeenCalled();
  });

  it("sanitizes category and updates only provided fields", async () => {
    prismaMock.videos.update.mockResolvedValue({ id: OID });
    const res = mockRes();
    await updateVideoMetadata(
      { params: { videoId: OID }, body: { category: "not_a_real_slug", title: "New" } } as unknown as Request,
      res
    );
    const data = prismaMock.videos.update.mock.calls[0][0].data;
    expect(data.category).toBeNull(); // unknown slug → null
    expect(data.title).toBe("New");
    expect("description" in data).toBe(false); // untouched
  });
});
