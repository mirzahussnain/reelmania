import { describe, it, expect } from "vitest";
import { normalizeHashtag, sanitizeHashtags } from "./hashtags";

describe("normalizeHashtag", () => {
  it("strips leading #, trims, and lowercases", () => {
    expect(normalizeHashtag("  #Gaming ")).toBe("gaming");
  });

  it("strips punctuation but keeps underscore", () => {
    expect(normalizeHashtag("motion_graphics!")).toBe("motion_graphics");
  });

  it("keeps unicode letters and digits and underscore", () => {
    expect(normalizeHashtag("#café_2024")).toBe("café_2024");
  });
});

describe("sanitizeHashtags", () => {
  it("drops empty strings (incl. the form's initial ['']) ", () => {
    expect(sanitizeHashtags([""])).toEqual([]);
    expect(sanitizeHashtags(["gaming", "   ", "#"])).toEqual(["gaming"]);
  });

  it("dedupes after normalization", () => {
    expect(sanitizeHashtags(["Gaming", "gaming", " GAMING "])).toEqual(["gaming"]);
  });

  it("normalizes each tag", () => {
    expect(sanitizeHashtags(["#VFX", " lifestyle "])).toEqual(["vfx", "lifestyle"]);
  });

  it("splits whitespace-separated words into separate tags (no merging)", () => {
    expect(sanitizeHashtags(["action jujutsu"])).toEqual(["action", "jujutsu"]);
    expect(sanitizeHashtags(["#action jujutsu, dance"])).toEqual(["action", "jujutsu", "dance"]);
  });

  it("accepts a raw string too", () => {
    expect(sanitizeHashtags("gaming lifestyle")).toEqual(["gaming", "lifestyle"]);
  });

  it("caps the number of tags", () => {
    const many = Array.from({ length: 30 }, (_, i) => `tag${i}`);
    expect(sanitizeHashtags(many).length).toBe(15);
  });

  it("returns [] for non-string/non-array input and skips non-string entries", () => {
    expect(sanitizeHashtags(undefined)).toEqual([]);
    expect(sanitizeHashtags(123)).toEqual([]);
    expect(sanitizeHashtags([1, null, {}, "ok"])).toEqual(["ok"]);
  });
});
