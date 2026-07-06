// Server-side controlled vocabulary for `video.category` — the single primary
// discipline a Kine belongs to (one slug, not a list). The client has a richer
// copy with display labels for the upload picker; the server only needs the
// valid slug set so it never trusts a client-supplied category. Keep in sync.

export const CATEGORY_SLUGS = new Set<string>([
  "3d_animation",
  "motion_graphics",
  "vfx_compositing",
  "simulation_fx",
  "character_rigging",
  "product_archviz",
  "generative",
  "game_art",
  "concept_illustration",
  "audio_reactive",
]);

/** Return the slug only if it's in the controlled vocab, else undefined. */
export const sanitizeCategory = (value: unknown): string | undefined =>
  typeof value === "string" && CATEGORY_SLUGS.has(value) ? value : undefined;
