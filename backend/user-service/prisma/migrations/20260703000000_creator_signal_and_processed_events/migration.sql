-- Creator signal (video_count) + event idempotency ledger (processed_events).
-- Additive and safe: new column defaults to 0, new table is independent.

-- AlterTable
ALTER TABLE "users" ADD COLUMN "video_count" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "processed_events" (
    "event_id" TEXT NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processed_events_pkey" PRIMARY KEY ("event_id")
);
