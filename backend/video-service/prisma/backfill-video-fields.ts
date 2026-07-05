/**
 * One-time (idempotent) backfill for the fields added to the `videos` model.
 *
 * MongoDB is schemaless and Prisma only applies `@default` values on CREATE, so
 * documents written before this schema change are missing the new REQUIRED /
 * defaulted / array fields. Prisma throws P2032 ("missing field") when it reads a
 * document lacking a required field — which would break loading existing videos.
 *
 * This sets sane defaults ONLY on documents where each field is absent
 * ($exists:false), so it is safe to re-run: already-backfilled docs are skipped,
 * and docs that legitimately set a non-default value are never overwritten.
 *
 * Optional fields (description, thumbnail_url, duration, width, height,
 * updated_at, external_url, embed_id, uploaded_by.avatar_url) are intentionally
 * NOT touched — null/absent is a valid value for them.
 *
 * Run:  npx prisma generate && npx tsx prisma/backfill-video-fields.ts
 * (honours VIDEO_DATABASE_URL; override it to point at the target DB.)
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const result = (await prisma.$runCommandRaw({
    update: "videos",
    updates: [
      { q: { visibility: { $exists: false } }, u: { $set: { visibility: "PUBLIC" } }, multi: true },
      { q: { view_count: { $exists: false } }, u: { $set: { view_count: 0 } }, multi: true },
      { q: { source_type: { $exists: false } }, u: { $set: { source_type: "NATIVE" } }, multi: true },
      { q: { software_used: { $exists: false } }, u: { $set: { software_used: [] } }, multi: true },
    ],
    // Ordered:false so one failing sub-update doesn't abort the rest.
    ordered: false,
  })) as { n?: number; nModified?: number };

  console.log(
    `[backfill] matched=${result.n ?? 0} modified=${result.nModified ?? 0} ` +
      `(fields: visibility, view_count, source_type, software_used)`
  );
}

main()
  .catch((err) => {
    console.error("[backfill] failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
