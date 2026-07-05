-- Rolling activity signal so the nightly C-Score job can bound its pool to users
-- active in the last N days (C_SCORE_CALCULATION.md §7), rather than scoring every
-- is_active row. Nullable: NULL = never-seen / legacy rows.
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "last_active_at" TIMESTAMP(6);
