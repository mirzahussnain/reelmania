// Hashtag normalization — the single source of truth for what a stored hashtag
// looks like. The For-You feed weights hashtags (hashtagScores keyed on the exact
// tag) and explore search does an exact `hashtags: { has: q }` match, so tags MUST
// be normalized consistently or the same concept fragments ("Gaming" vs "gaming"
// vs " gaming ") and silently degrades recommendations + search.
//
// The client runs the same normalization for instant feedback, but the server
// NEVER trusts client tags — createVideo re-runs this at write time.
//
// Rules: split on whitespace/commas → strip leading '#' → lowercase → keep only
// letters/numbers/underscore → drop empties → dedupe → cap length & count.
//
// Whitespace SEPARATES tags, it is not deleted: "action jujutsu" → two tags
// (#action #jujutsu), never one merged "#actionjujutsu". A genuine multi-word
// concept should be joined with an underscore ("motion_graphics"), the standard
// hashtag convention.

const HASHTAG_MAX_LEN = 50;
const HASHTAG_MAX_COUNT = 15;

/** Normalize a SINGLE already-tokenized tag (no internal whitespace expected). */
export const normalizeHashtag = (raw: string): string =>
  raw
    .trim()
    .replace(/^#+/, "")        // "#gaming" → "gaming"
    .toLowerCase()
    .replace(/[^\p{L}\p{N}_]/gu, "") // drop punctuation/symbols, keep unicode letters/digits
    .slice(0, HASHTAG_MAX_LEN);

/**
 * Tokenize free-form input into clean tags. Accepts a string or an array of
 * strings; each entry is split on whitespace AND commas so "#action jujutsu,dance"
 * → ["action","jujutsu","dance"]. Then normalize, drop empties, dedupe, and cap.
 */
export const sanitizeHashtags = (tags: unknown): string[] => {
  const raw = Array.isArray(tags) ? tags : typeof tags === "string" ? [tags] : [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const entry of raw) {
    if (typeof entry !== "string") continue;
    for (const token of entry.split(/[\s,]+/)) {
      const norm = normalizeHashtag(token);
      if (!norm || seen.has(norm)) continue;
      seen.add(norm);
      out.push(norm);
      if (out.length >= HASHTAG_MAX_COUNT) return out;
    }
  }
  return out;
};
