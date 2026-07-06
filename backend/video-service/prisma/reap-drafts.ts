// Standalone entry for a scheduled cleanup of stale drafts (k8s CronJob):
//   npm run reap:drafts
// Runs one sweep and exits. The same logic also runs in-process daily (guarded
// by a Redis lock) — this script is for deployments that prefer an external
// scheduler over the in-process timer.
import { reapStaleDrafts } from "../src/workers/draftReaper";
import prisma from "../src/utils/dbconnection.config";

reapStaleDrafts()
  .then((n) => {
    console.log(`[reap-drafts] reaped ${n} stale draft(s)`);
  })
  .catch((err) => {
    console.error("[reap-drafts] failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
