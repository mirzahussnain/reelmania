// Client mirror of video-service's hashtag normalization. Keep the rules in sync
// with backend/video-service/src/utils/hashtags.ts — the server re-runs this at
// write time (never trusts the client), but running it here gives instant, honest
// feedback and stops the form's initial [""] from ever being submitted.
//
// Rules: split on whitespace/commas → strip leading '#' → lowercase → keep only
// letters/numbers/underscore → drop empties → dedupe → cap length & count.
// Whitespace SEPARATES tags (it is not deleted): "action jujutsu" → #action
// #jujutsu, never "#actionjujutsu". Use an underscore for a genuine multi-word tag.

const HASHTAG_MAX_LEN = 50;
const HASHTAG_MAX_COUNT = 15;

/** Normalize a SINGLE already-tokenized tag (no internal whitespace expected). */
export const normalizeHashtag = (raw: string): string =>
  raw
    .trim()
    .replace(/^#+/, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}_]/gu, "")
    .slice(0, HASHTAG_MAX_LEN);

/**
 * Tokenize free-form input into clean tags. Accepts a string or array of strings;
 * each entry is split on whitespace AND commas, then normalized, deduped, capped.
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
