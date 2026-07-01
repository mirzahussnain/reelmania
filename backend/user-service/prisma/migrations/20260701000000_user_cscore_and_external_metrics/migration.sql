-- user-service schema update: role text→enum, profile/status/C-Score columns,
-- and the 1:1 user_external_metrics table.  (Provider: PostgreSQL)
--
-- The role conversion is ORDER-SENSITIVE: existing values must be normalized to
-- valid enum labels BEFORE the column type is altered, or the ::"Role" cast
-- fails. This whole file is transactional-safe — apply it as one unit
-- (`prisma migrate deploy`, or `psql -1 -f migration.sql`) so a mid-way failure
-- rolls back cleanly. Do NOT rely on `prisma db push` for the role change: it
-- would drop/recreate the column and reset every user's role to the default.

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('Curator', 'Admin');

-- Normalize legacy role values so every existing row holds a valid enum label
UPDATE "users" SET "role" = 'Curator' WHERE "role" NOT IN ('Curator', 'Admin');

-- AlterTable: convert users.role  TEXT -> "Role"
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "Role" USING "role"::"Role";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'Curator';

-- AlterTable: additive profile / status / C-Score columns (backfilled by defaults)
ALTER TABLE "users" ADD COLUMN "bio" TEXT;
ALTER TABLE "users" ADD COLUMN "is_founding_member" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "is_verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN "c_score" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "c_score_raw" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "c_score_updated_at" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "user_external_metrics" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "youtube_channel_id" TEXT,
    "youtube_followers" INTEGER NOT NULL DEFAULT 0,
    "youtube_view_count" BIGINT NOT NULL DEFAULT 0,
    "last_synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_external_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_external_metrics_user_id_key" ON "user_external_metrics"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_external_metrics_youtube_channel_id_key" ON "user_external_metrics"("youtube_channel_id");

-- AddForeignKey
ALTER TABLE "user_external_metrics" ADD CONSTRAINT "user_external_metrics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
