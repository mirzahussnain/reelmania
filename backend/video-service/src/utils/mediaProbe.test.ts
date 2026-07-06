import { describe, it, expect, beforeAll, afterAll } from "vitest";
import os from "os";
import path from "path";
import { mkdtemp, rm, stat } from "fs/promises";
import ffmpeg from "fluent-ffmpeg";
import { probeMedia, extractThumbnail } from "./mediaProbe";

// ffmpeg-static is a dev-only dependency; skip the whole suite if it (and no
// system ffmpeg) is available, matching how mediaProbe resolves its binary.
let ffmpegStatic: string | undefined;
try {
  ffmpegStatic = require("ffmpeg-static");
} catch {
  ffmpegStatic = undefined;
}

// Generate a deterministic synthetic clip with ffmpeg's testsrc so the pipeline
// is exercised end-to-end (ffprobe read + thumbnail extract) without a fixture
// binary in the repo.
const makeTestClip = (dest: string): Promise<void> =>
  new Promise((resolve, reject) => {
    ffmpeg()
      .input("testsrc=duration=2:size=320x240:rate=24")
      .inputFormat("lavfi")
      .outputOptions(["-pix_fmt yuv420p"])
      .on("end", () => resolve())
      .on("error", reject)
      .save(dest);
  });

describe("mediaProbe", () => {
  let dir: string;
  let clip: string;
  const hasFfmpeg = !!(process.env.FFMPEG_PATH || ffmpegStatic);

  beforeAll(async () => {
    if (!hasFfmpeg) return;
    dir = await mkdtemp(path.join(os.tmpdir(), "mediaprobe-test-"));
    clip = path.join(dir, "clip.mp4");
    await makeTestClip(clip);
  }, 30000);

  afterAll(async () => {
    if (dir) await rm(dir, { recursive: true, force: true }).catch(() => {});
  });

  it.skipIf(!hasFfmpeg)("reads trusted duration/width/height/fps", async () => {
    const meta = await probeMedia(clip);
    expect(meta.width).toBe(320);
    expect(meta.height).toBe(240);
    expect(meta.fps).toBe(24);
    expect(meta.duration).toBe(2);
  });

  it.skipIf(!hasFfmpeg)("extracts a non-empty poster frame", async () => {
    const thumb = path.join(dir, "poster.jpg");
    await extractThumbnail(clip, thumb, 1);
    const info = await stat(thumb);
    expect(info.size).toBeGreaterThan(0);
  });
});
