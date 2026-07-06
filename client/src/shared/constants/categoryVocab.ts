// Canonical "category" vocabulary — the single primary discipline a Kine belongs
// to (video.category). The top-level discovery axis for The Radar, distinct from
// hashtags (freeform-ish) and software_used (tools). Stored ALWAYS as the
// lowercase `slug`; rendered via `label`. Keep the slugs in sync with the
// server's categoryVocab.
//
// Curated, not exhaustive — add entries here rather than letting users invent
// slugs.

export interface CategoryTag {
  slug: string;
  label: string;
}

export const CATEGORY_VOCAB: readonly CategoryTag[] = [
  { slug: "3d_animation", label: "3D Animation" },
  { slug: "motion_graphics", label: "Motion Graphics" },
  { slug: "vfx_compositing", label: "VFX & Compositing" },
  { slug: "simulation_fx", label: "Simulation & FX" },
  { slug: "character_rigging", label: "Character & Rigging" },
  { slug: "product_archviz", label: "Product & Archviz" },
  { slug: "generative", label: "Generative / Creative Coding" },
  { slug: "game_art", label: "Game Art" },
  { slug: "concept_illustration", label: "Concept & Illustration" },
  { slug: "audio_reactive", label: "Audio-Reactive" },
] as const;

/** Set of valid slugs — use to validate a selected category. */
export const CATEGORY_SLUGS = new Set(CATEGORY_VOCAB.map((c) => c.slug));

/** slug → display label, for rendering a stored category. */
export const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORY_VOCAB.map((c) => [c.slug, c.label])
);

/** Return the slug only if it's in the controlled vocab, else undefined. */
export const sanitizeCategory = (value: unknown): string | undefined =>
  typeof value === "string" && CATEGORY_SLUGS.has(value) ? value : undefined;
