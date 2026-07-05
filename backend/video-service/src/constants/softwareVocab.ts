// Server-side controlled vocabulary for `video.software_used`. The client has a
// richer copy (with labels/categories for the picker); the server only needs the
// valid slug set so it never trusts client tags — anything outside this set is
// dropped at write time. Keep the slugs in sync with the client vocab.

export const SOFTWARE_SLUGS = new Set<string>([
  // 3d / engines
  "blender",
  "cinema4d",
  "houdini",
  "maya",
  "3dsmax",
  "unreal",
  "unity",
  "zbrush",
  // compositing / vfx
  "nuke",
  "fusion",
  "after_effects",
  // motion / design
  "cavalry",
  "touchdesigner",
  // editing / grade
  "premiere",
  "davinci",
  "finalcut",
  // audio
  "ableton",
  "logic",
]);

// Cap so a single upload can't stuff an unbounded array.
const SOFTWARE_MAX = 12;

/** Keep only known slugs, dedupe, and cap. Non-array input → []. */
export const sanitizeSoftware = (tags: unknown): string[] => {
  if (!Array.isArray(tags)) return [];
  const clean = [...new Set(tags.filter((t): t is string => typeof t === "string" && SOFTWARE_SLUGS.has(t)))];
  return clean.slice(0, SOFTWARE_MAX);
};
