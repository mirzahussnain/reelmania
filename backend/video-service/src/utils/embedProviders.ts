// Embed source detection + metadata enrichment for the "Dead Asset" import path
// (roadmap Phase B). Given a pasted URL we (1) detect the provider and stable
// video id, and (2) enrich title/thumbnail/duration via the provider's public
// oEmbed endpoint — which needs NO API key or OAuth. Duration is only available
// from some providers (Vimeo); leaving it null on an embed is expected (ADR 0002).

export type EmbedSource = "YOUTUBE" | "TIKTOK" | "VIMEO";

export interface ParsedEmbed {
  source_type: EmbedSource;
  embed_id: string;
}

export interface EmbedMeta {
  title?: string;
  thumbnail_url?: string;
  duration?: number; // seconds, when the provider exposes it
  author_name?: string;
}

// Provider URL shapes we accept. Kept deliberately small — add patterns as we
// support more sources rather than trying to be exhaustive.
const YT_PATTERNS = [
  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([\w-]{11})/,
];
const VIMEO_PATTERNS = [/vimeo\.com\/(?:video\/)?(\d+)/];
const TIKTOK_PATTERNS = [/tiktok\.com\/@[\w.-]+\/video\/(\d+)/, /tiktok\.com\/t\/(\w+)/];

/** Detect provider + stable id from a pasted URL, or null if unrecognized. */
export const parseEmbedUrl = (url: string): ParsedEmbed | null => {
  if (typeof url !== "string" || !url.trim()) return null;
  for (const re of YT_PATTERNS) {
    const m = url.match(re);
    if (m) return { source_type: "YOUTUBE", embed_id: m[1] };
  }
  for (const re of VIMEO_PATTERNS) {
    const m = url.match(re);
    if (m) return { source_type: "VIMEO", embed_id: m[1] };
  }
  for (const re of TIKTOK_PATTERNS) {
    const m = url.match(re);
    if (m) return { source_type: "TIKTOK", embed_id: m[1] };
  }
  return null;
};

const OEMBED_ENDPOINT: Record<EmbedSource, (url: string) => string> = {
  YOUTUBE: (u) => `https://www.youtube.com/oembed?url=${encodeURIComponent(u)}&format=json`,
  VIMEO: (u) => `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(u)}`,
  TIKTOK: (u) => `https://www.tiktok.com/oembed?url=${encodeURIComponent(u)}`,
};

/**
 * Fetch public oEmbed metadata for an embed URL. Fail-soft: any error (network,
 * private/removed video, provider hiccup) resolves to `{}` rather than throwing,
 * so an import still creates a DRAFT the creator can enrich by hand. `duration`
 * is only returned by Vimeo's oEmbed.
 */
export const fetchEmbedMeta = async (
  source_type: EmbedSource,
  url: string
): Promise<EmbedMeta> => {
  try {
    const res = await fetch(OEMBED_ENDPOINT[source_type](url), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return {};
    const data: any = await res.json();
    return {
      title: typeof data.title === "string" ? data.title : undefined,
      thumbnail_url: typeof data.thumbnail_url === "string" ? data.thumbnail_url : undefined,
      duration: typeof data.duration === "number" ? Math.round(data.duration) : undefined,
      author_name: typeof data.author_name === "string" ? data.author_name : undefined,
    };
  } catch {
    return {};
  }
};
