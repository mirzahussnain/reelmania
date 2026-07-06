import { describe, it, expect, vi, beforeEach } from "vitest";

const { prismaMock, deleteFileMock, publishMock } = vi.hoisted(() => ({
  prismaMock: { videos: { findMany: vi.fn(), delete: vi.fn() } },
  deleteFileMock: vi.fn().mockResolvedValue(true),
  publishMock: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../utils/dbconnection.config", () => ({ default: prismaMock }));
vi.mock("../providers/StorageFactory", () => ({
  StorageFactory: { getProvider: () => ({ deleteFile: deleteFileMock }) },
}));
vi.mock("../utils/rabbitmq", () => ({
  rabbitMQService: { publish: publishMock },
  VIDEO_EXCHANGE: "video.events",
}));
vi.mock("../utils/redis", () => ({ getRedisClient: () => ({ set: vi.fn() }) }));

import { reapStaleDrafts } from "./draftReaper";

beforeEach(() => vi.clearAllMocks());

describe("reapStaleDrafts", () => {
  it("returns 0 and does nothing when there are no stale drafts", async () => {
    prismaMock.videos.findMany.mockResolvedValue([]);
    const n = await reapStaleDrafts();
    expect(n).toBe(0);
    expect(prismaMock.videos.delete).not.toHaveBeenCalled();
  });

  it("only queries DRAFTs past the cutoff", async () => {
    prismaMock.videos.findMany.mockResolvedValue([]);
    await reapStaleDrafts();
    const where = prismaMock.videos.findMany.mock.calls[0][0].where;
    expect(where.visibility).toBe("DRAFT");
    expect(where.uploaded_at.lt).toBeInstanceOf(Date);
  });

  it("deletes the storage object only for NATIVE drafts, and always the row + event", async () => {
    prismaMock.videos.findMany.mockResolvedValue([
      { id: "n1", source_type: "NATIVE", video_url: "http://minio/videos/a.mp4", uploaded_by: { id: "u1" } },
      { id: "e1", source_type: "YOUTUBE", video_url: null, uploaded_by: { id: "u2" } },
    ]);
    prismaMock.videos.delete.mockResolvedValue({});

    const n = await reapStaleDrafts();

    expect(n).toBe(2);
    // Native → storage object removed by key; embed → no storage call.
    expect(deleteFileMock).toHaveBeenCalledTimes(1);
    expect(deleteFileMock).toHaveBeenCalledWith("a.mp4");
    expect(prismaMock.videos.delete).toHaveBeenCalledTimes(2);
    expect(publishMock).toHaveBeenCalledTimes(2);
    expect(publishMock).toHaveBeenCalledWith("video.events", "video.deleted", expect.objectContaining({ videoId: "n1" }));
  });
});
