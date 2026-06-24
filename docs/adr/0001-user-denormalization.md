# ADR 0001 — Denormalized user fields across services, synced by fan-out

- **Status:** Accepted
- **Date:** 2026-06-24
- **Context phase:** IMPLEMENTATION_PLAN 2.1

## Context

`username` and `avatar_url` are user-service (PostgreSQL) data, but the
video-service (MongoDB) needs them to render videos, comments, and likes without
a cross-service call on every read. They are therefore **denormalized** into
video-service documents:

- `videos.uploaded_by` (`{ id, username }`)
- `Comment` rows (`username`, `avatar_url`)
- `Like` rows (`username`)

The original problem (2.1): nothing propagated profile edits to the
video-service, so old videos/comments showed stale names/avatars. Clerk webhooks
only reached the user-service.

## Options considered

1. **Resolve display fields at read time** — store only `userId` in
   video-service; join/look up the current name+avatar per read (or via a
   short-TTL cache). Always fresh, but adds a cross-service dependency to the
   hottest read paths (feed, comments) and couples video reads to user-service
   availability.
2. **Keep denormalized, sync on change via events** — publish `user.updated` /
   `user.deleted` from the user-service onto a RabbitMQ fan-out; a video-service
   consumer back-fills the denormalized copies. Reads stay self-contained and
   fast; the cost is eventual consistency and a sync worker.

## Decision

**Option 2.** Keep the denormalized fields and synchronise them asynchronously.

- The user-service publishes to the `user_events` exchange from the Clerk
  webhook handler (`hookController`) on `user.created` / `user.updated` /
  `user.deleted`.
- The video-service runs `userEventsWorker`, which back-fills
  `videos.uploaded_by`, `Comment`, and `Like` for the affected `userId` (and
  has a dead-letter queue with bounded retries for poison messages).

This preserves the read-path performance the architecture is built around
(Redis-cached feed, precomputed For-You queue) without making video reads depend
on the user-service being up.

## Consequences

- **Positive:** feed/comment/like reads need no cross-service hop; resilient to
  user-service downtime; the sync path reuses the existing webhook → queue →
  worker pattern (the same one payments will use).
- **Negative:** display fields are **eventually** consistent — a profile edit
  appears across old content within one event cycle, not instantly. A missed/
  failed event can leave stale copies until redelivered (mitigated by the DLQ).
- **Revisit if:** we add fields that must be strongly consistent, or the volume
  of denormalized copies makes back-fill expensive — at which point a
  resolve-at-read cache (Option 1) becomes the better trade.
