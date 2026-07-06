// ffprobe-static ships no types. It exports the bundled binary path for the
// current platform (plus a per-arch map we don't use here).
declare module "ffprobe-static" {
  const ffprobe: { path: string };
  export default ffprobe;
}
