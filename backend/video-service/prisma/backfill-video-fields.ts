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
 * It also normalizes existing `hashtags` through the SAME sanitizer the write
 * path uses (utils/hashtags), so tags stored before normalization ("#Gaming",
 * " lifestyle", dupes, the form's stray "") line up with the feed's exact-match
 * weighting + explore search. This pass only writes docs whose tags actually
 * change, so it too is safe to re-run.
 *
 * Run:  npx prisma generate && npx tsx prisma/backfill-video-fields.ts
 * (honours VIDEO_DATABASE_URL; override it to point at the target DB.)
 */
import { PrismaClient } from "@prisma/client";
import { sanitizeHashtags } from "../src/utils/hashtags";

const prisma = new PrismaClient();

async function main() {
  // Pass 1 — set defaults on docs missing the new required/defaulted fields.
  const result = (await prisma.$runCommandRaw({
    update: "videos",
    updates: [
      { q: { visibility: { $exists: false } }, u: { $set: { visibility: "PUBLIC" } }, multi: true },
      { q: { view_count: { $exists: false } }, u: { $set: { view_count: 0 } }, multi: true },
      { q: { source_type: { $exists: false } }, u: { $set: { source_type: "NATIVE" } }, multi: true },
      { q: { software_used: { $exists: false } }, u: { $set: { software_used: [] } }, multi: true },
      { q: { processing_status: { $exists: false } }, u: { $set: { processing_status: "READY" } }, multi: true },
    ],
    // Ordered:false so one failing sub-update doesn't abort the rest.
    ordered: false,
  })) as { n?: number; nModified?: number };

  console.log(
    `[backfill] matched=${result.n ?? 0} modified=${result.nModified ?? 0} ` +
      `(fields: visibility, view_count, source_type, software_used, processing_status)`
  );

  // Pass 2 — normalize existing hashtags. Reads are safe now that pass 1 has
  // populated the required fields. Only writes docs whose tags actually change.
  const docs = await prisma.videos.findMany({ select: { id: true, hashtags: true } });
  let hashtagsChanged = 0;
  for (const doc of docs) {
    const normalized = sanitizeHashtags(doc.hashtags);
    // Cheap deep-equality via JSON — order matters, which is what we want (the
    // sanitizer preserves first-seen order).
    if (JSON.stringify(normalized) === JSON.stringify(doc.hashtags)) continue;
    await prisma.videos.update({ where: { id: doc.id }, data: { hashtags: normalized } });
    hashtagsChanged++;
  }

  console.log(`[backfill] hashtags normalized on ${hashtagsChanged}/${docs.length} docs`);
}

main()
  .catch((err) => {
    console.error("[backfill] failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
