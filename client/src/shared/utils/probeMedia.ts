// Probe intrinsic media metadata from a selected file entirely client-side (no
// upload needed) for instant UX. These values are PROVISIONAL only — the server
// re-probes with ffprobe and overwrites them (they gate PRO 4K/60, so the client
// is never trusted). Fail-soft: unreadable file → {}.
export type MediaMeta = { duration?: number; width?: number; height?: number };

export const probeMediaMeta = (file: File): Promise<MediaMeta> =>
  new Promise((resolve) => {
    try {
      const el = document.createElement("video");
      el.preload = "metadata";
      const url = URL.createObjectURL(file);
      el.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve({
          duration: Number.isFinite(el.duration) ? Math.round(el.duration) : undefined,
          width: el.videoWidth || undefined,
          height: el.videoHeight || undefined,
        });
      };
      el.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({});
      };
      el.src = url;
    } catch {
      resolve({});
    }
  });
