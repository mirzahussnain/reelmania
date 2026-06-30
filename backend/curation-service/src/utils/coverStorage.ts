import {
  S3Client,
  DeleteObjectCommand,
  PutObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  PutBucketPolicyCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { logger } from "./logger";

/**
 * Collection-cover object storage — OWNED BY curation-service.
 *
 * curation-service keeps its cover images in its OWN bucket (default
 * `collection-covers`), separate from video-service's `videos` bucket. This is
 * per-service storage ownership: curation presigns its uploads and deletes its
 * own orphans without calling another service. S3-compatible, so the same code
 * runs on MinIO locally and R2/S3 in production by swapping env vars.
 */
const BUCKET = process.env.CURATION_S3_BUCKET || "collection-covers";
const REGION = process.env.S3_REGION || "us-east-1";
const ACCESS_KEY = process.env.S3_ACCESS_KEY || "minioadmin";
const SECRET_KEY = process.env.S3_SECRET_KEY || "minioadmin";

// Public read base (browser-facing), e.g. http://localhost:9000/collection-covers
const PUBLIC_DOMAIN =
  process.env.CURATION_S3_PUBLIC_DOMAIN || `http://localhost:9000/${BUCKET}`;

// Presign client signs against the PUBLIC host so the browser's PUT host matches
// the signature (strip the trailing /<bucket> from the public domain).
const presignEndpoint = PUBLIC_DOMAIN.split(`/${BUCKET}`)[0] || "http://localhost:9000";

// Internal client (server → MinIO/S3): bucket create + deletes. In docker
// S3_ENDPOINT is the internal hostname (http://minio:9000); when unset (local
// dev) fall back to the public host so it still reaches MinIO at localhost:9000.
const s3Client = new S3Client({
  region: REGION,
  endpoint: process.env.S3_ENDPOINT || presignEndpoint,
  credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
  forcePathStyle: true,
});

const s3PresignClient = new S3Client({
  region: REGION,
  endpoint: presignEndpoint,
  credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
  forcePathStyle: true,
});

/**
 * Ensure the cover bucket exists and serves objects publicly (read-only).
 * Idempotent and best-effort: called once on boot. On a managed store (R2/S3)
 * where the bucket is pre-provisioned and credentials can't create buckets, the
 * calls fail harmlessly and are logged — the bucket is assumed to already exist.
 */
export const ensureCoverBucket = async (): Promise<void> => {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET }));
    return; // already exists (assume policy was set at creation)
  } catch {
    // Not found / no access → try to create it below.
  }
  try {
    await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET }));
    const policy = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: { AWS: ["*"] },
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${BUCKET}/*`],
        },
      ],
    };
    await s3Client.send(
      new PutBucketPolicyCommand({ Bucket: BUCKET, Policy: JSON.stringify(policy) })
    );
    logger.info({ bucket: BUCKET }, "[coverStorage] created cover bucket with public-read policy");
  } catch (err) {
    logger.warn({ err, bucket: BUCKET }, "[coverStorage] could not ensure cover bucket; assuming pre-provisioned");
  }
};

/** Presign a cover upload. Returns the signed PUT URL, the storage key, and the
 *  public read URL the file will resolve to once uploaded. */
export const presignCoverUpload = async (originalName: string, contentType: string) => {
  const key = `${randomUUID()}-${originalName}`;
  const command = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType });
  const signedUrl = await getSignedUrl(s3PresignClient, command, { expiresIn: 900 });
  return { signedUrl, fileName: key, publicUrl: `${PUBLIC_DOMAIN}/${key}` };
};

/** The storage key for a cover, from the public URL we stored on the collection. */
export const coverKeyFromUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  // Only act on URLs that belong to OUR cover bucket; ignore anything else.
  if (!url.includes(`/${BUCKET}/`)) return null;
  const key = url.split(`/${BUCKET}/`)[1]?.split("?")[0];
  return key || null;
};

/** Delete a cover object by its public URL. Fail-soft: a storage hiccup must
 *  never fail the collection mutation it accompanies — it just leaves an orphan
 *  to be swept later. No-op for URLs outside our bucket. */
export const deleteCoverByUrl = async (url: string | null | undefined): Promise<void> => {
  const key = coverKeyFromUrl(url);
  if (!key) return;
  try {
    await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
    logger.info({ key }, "[coverStorage] deleted orphaned cover");
  } catch (err) {
    logger.warn({ err, key }, "[coverStorage] cover delete failed; leaving orphan");
  }
};
