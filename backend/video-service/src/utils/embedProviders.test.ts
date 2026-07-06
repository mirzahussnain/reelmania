import { describe, it, expect } from "vitest";
import { parseEmbedUrl } from "./embedProviders";

describe("parseEmbedUrl", () => {
  it("detects YouTube watch / short / youtu.be links", () => {
    expect(parseEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toEqual({
      source_type: "YOUTUBE",
      embed_id: "dQw4w9WgXcQ",
    });
    expect(parseEmbedUrl("https://youtu.be/dQw4w9WgXcQ")).toEqual({
      source_type: "YOUTUBE",
      embed_id: "dQw4w9WgXcQ",
    });
    expect(parseEmbedUrl("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toEqual({
      source_type: "YOUTUBE",
      embed_id: "dQw4w9WgXcQ",
    });
  });

  it("detects Vimeo links", () => {
    expect(parseEmbedUrl("https://vimeo.com/123456789")).toEqual({
      source_type: "VIMEO",
      embed_id: "123456789",
    });
  });

  it("detects TikTok video links", () => {
    expect(parseEmbedUrl("https://www.tiktok.com/@creator/video/7300000000000000000")).toEqual({
      source_type: "TIKTOK",
      embed_id: "7300000000000000000",
    });
  });

  it("returns null for unrecognized / empty input", () => {
    expect(parseEmbedUrl("https://example.com/video/1")).toBeNull();
    expect(parseEmbedUrl("")).toBeNull();
    expect(parseEmbedUrl(undefined as unknown as string)).toBeNull();
  });
});
