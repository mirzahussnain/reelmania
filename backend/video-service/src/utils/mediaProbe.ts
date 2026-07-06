import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";

// Resolve the ffmpeg/ffprobe binaries. Prefer an explicit env path (set in the
// Alpine container to the apk-installed, musl-native /usr/bin binaries), and
// fall back to the bundled glibc static binaries for local dev — those static
// binaries do NOT run on Alpine/musl, hence the container override.
const ffmpegPath = process.env.FFMPEG_PATH || (ffmpegStatic as unknown as string | null);
const ffprobePath = process.env.FFPROBE_PATH || ffprobeStatic?.path;
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
