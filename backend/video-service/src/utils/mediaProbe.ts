import ffmpeg from "fluent-ffmpeg";

// Resolve the ffmpeg/ffprobe binaries.
//
// In production (Alpine) the image installs musl-native ffmpeg via apk and sets
// FFMPEG_PATH/FFPROBE_PATH — so we use those and never touch the static packages.
// For local dev those env vars are unset, so we fall back to the bundled
// ffmpeg-static/ffprobe-static binaries. Those are DEV-ONLY dependencies (~400MB
// of glibc binaries that can't even run on musl), so the require is optional:
// prod won't have them installed, and must never crash for their absence.
const resolveStatic = (mod: string, pick: (m: any) => string | undefined) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return pick(require(mod));
  } catch {
    return undefined;
  }
};

const ffmpegPath =
  process.env.FFMPEG_PATH || resolveStatic("ffmpeg-static", (m) => m?.default ?? m);
const ffprobePath =
  process.env.FFPROBE_PATH || resolveStatic("ffprobe-static", (m) => m?.path);
if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath);
if (ffprobePath) ffmpeg.setFfprobePath(ffprobePath);

export interface ProbedMedia {
  duration?: number; // whole seconds
  width?: number;
  height?: number;
  fps?: number; // rounded frames-per-second
}

/**
 * Read TRUSTED media metadata off a local file with ffprobe. This is the source
 * of truth for duration/width/height/fps (ADR 0002) — unlike the client's
 * `<video>` probe, it cannot be spoofed to bypass PRO 4K/60 gating.
 */
export const probeMedia = (filePath: string): Promise<ProbedMedia> =>
  new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, data) => {
      if (err) return reject(err);

      const videoStream = data.streams?.find((s) => s.codec_type === "video");
      const durationRaw = data.format?.duration ?? videoStream?.duration;

      // ffprobe reports frame rate as a rational string ("30000/1001", "25/1").
      let fps: number | undefined;
      const rate = videoStream?.avg_frame_rate || videoStream?.r_frame_rate;
      if (rate && rate !== "0/0") {
        const [num, den] = rate.split("/").map(Number);
        if (num && den) fps = Math.round(num / den);
      }

      resolve({
        duration: durationRaw ? Math.round(Number(durationRaw)) : undefined,
        width: videoStream?.width || undefined,
        height: videoStream?.height || undefined,
        fps,
      });
    });
  });

/**
 * Extract a single poster frame to `destPath` (JPEG). Seeks a short way in so
 * the thumbnail isn't a black/fade-in first frame; clamps the seek for very
 * short clips.
 */
export const extractThumbnail = (
  filePath: string,
  destPath: string,
  atSeconds = 1
): Promise<void> =>
  new Promise((resolve, reject) => {
    ffmpeg(filePath)
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .screenshots({
        timestamps: [atSeconds],
        filename: destPath.split(/[\\/]/).pop() as string,
        folder: destPath.replace(/[\\/][^\\/]+$/, ""),
        size: "720x?",
      });
  });
