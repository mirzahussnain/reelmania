import { describe, it, expect } from "vitest";
import { interleaveByCreator } from "./interleaveByCreator";

const v = (id: string, creator: string) => ({ id, uploaded_by: { id: creator } });

describe("interleaveByCreator", () => {
  it("spreads a batch-uploader so no two consecutive share a creator (when possible)", () => {
    // Recency-ordered input: A dominates the newest slots.
    const input = [
      v("a1", "A"), v("a2", "A"), v("a3", "A"),
      v("b1", "B"), v("c1", "C"),
    ];
    const out = interleaveByCreator(input);

    // Same items, no loss/duplication.
    expect(out.map((x) => x.id).sort()).toEqual(["a1", "a2", "a3", "b1", "c1"]);

    // No two consecutive from the same creator until the unavoidable tail.
    const creators = out.map((x) => x.uploaded_by.id);
    // Round 1 emits one per creator (A,B,C), leaving A,A for the tail.
    expect(creators.slice(0, 3)).toEqual(["A", "B", "C"]);
  });

  it("preserves recency order within a single creator's items", () => {
    const input = [v("a1", "A"), v("b1", "B"), v("a2", "A")];
    const out = interleaveByCreator(input);
    const aOrder = out.filter((x) => x.uploaded_by.id === "A").map((x) => x.id);
    expect(aOrder).toEqual(["a1", "a2"]);
  });

  it("returns short lists unchanged", () => {
    const input = [v("a1", "A"), v("a2", "A")];
    expect(interleaveByCreator(input)).toEqual(input);
  });

  it("leads with the most-recent creator (recency priority)", () => {
    const input = [v("x1", "X"), v("y1", "Y"), v("y2", "Y")];
    const out = interleaveByCreator(input);
    expect(out[0].uploaded_by.id).toBe("X");
  });
});
