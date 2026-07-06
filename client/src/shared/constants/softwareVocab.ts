// Canonical "software" vocabulary — the controlled tag space for the tools a
// Kine was made with (video.software_used) and, later, a creator's primary stack
// (user.software_stack for The Radar). Free-text tags fragment instantly
// ("Blender" vs "blender" vs "Blender 3D"), which makes Radar filtering useless,
// so tags are ALWAYS stored as the lowercase `slug` and only rendered via `label`.
//
// This list is intentionally curated, not exhaustive. Add entries here rather
// than letting users invent slugs.

export interface SoftwareTag {
  slug: string;   // stored value — stable, lowercase, no spaces
  label: string;  // display name
  category: "3d" | "compositing" | "editing" | "motion" | "audio";
}

export const SOFTWARE_VOCAB: readonly SoftwareTag[] = [
  // 3D / engines
  { slug: "blender", label: "Blender", category: "3d" },
  { slug: "cinema4d", label: "Cinema 4D", category: "3d" },
  { slug: "houdini", label: "Houdini", category: "3d" },
  { slug: "maya", label: "Maya", category: "3d" },
  { slug: "3dsmax", label: "3ds Max", category: "3d" },
  { slug: "unreal", label: "Unreal Engine", category: "3d" },
  { slug: "unity", label: "Unity", category: "3d" },
  { slug: "zbrush", label: "ZBrush", category: "3d" },
  // Compositing / VFX
  { slug: "nuke", label: "Nuke", category: "compositing" },
  { slug: "fusion", label: "Fusion", category: "compositing" },
  { slug: "after_effects", label: "After Effects", category: "motion" },
  // Motion / design
  { slug: "cavalry", label: "Cavalry", category: "motion" },
  { slug: "touchdesigner", label: "TouchDesigner", category: "motion" },
  // Editing / grade
  { slug: "premiere", label: "Premiere Pro", category: "editing" },
  { slug: "davinci", label: "DaVinci Resolve", category: "editing" },
  { slug: "finalcut", label: "Final Cut Pro", category: "editing" },
  // Audio
  { slug: "ableton", label: "Ableton Live", category: "audio" },
  { slug: "logic", label: "Logic Pro", category: "audio" },
] as const;

/** Set of valid slugs — use to validate/sanitize incoming tags. */
export const SOFTWARE_SLUGS = new Set(SOFTWARE_VOCAB.map((s) => s.slug));

/** slug → display label, for rendering stored tags. */
export const SOFTWARE_LABELS: Record<string, string> = Object.fromEntries(
  SOFTWARE_VOCAB.map((s) => [s.slug, s.label])
);

/** Drop anything not in the controlled vocabulary; dedupe. */
export const sanitizeSoftware = (tags: string[]): string[] =>
  [...new Set(tags.filter((t) => SOFTWARE_SLUGS.has(t)))];
