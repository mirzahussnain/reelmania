import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchFollowingIds } from "./userClient";

// userClient is the ONLY sync dependency on user-service; it must fail SOFT —
// any non-OK / network error degrades to [] rather than throwing.
beforeEach(() => vi.restoreAllMocks());
afterEach(() => vi.unstubAllGlobals());

describe("fetchFollowingIds", () => {
  it("returns [] without fetching when userId is empty", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    expect(await fetchFollowingIds("")).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns the ids from a successful response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: ["a", "b"] }) })
    );
    expect(await fetchFollowingIds("me")).toEqual(["a", "b"]);
  });

  it("degrades to [] on a non-OK response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    expect(await fetchFollowingIds("me")).toEqual([]);
  });

  it("degrades to [] on a network/timeout error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("aborted")));
    expect(await fetchFollowingIds("me")).toEqual([]);
  });

  it("tolerates a malformed body (no data array)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
    expect(await fetchFollowingIds("me")).toEqual([]);
  });
});
