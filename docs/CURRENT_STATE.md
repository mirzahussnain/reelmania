# Kinetix — Current State Snapshot

> A living snapshot of where the app actually is, to sit alongside the aspirational
> `KINETIX_PRODUCTION_ROADMAP.md`. Update this when a phase/branch lands.

**As of:** 2026-07-06

## The honest one-liner

A **well-architected prototype**: scalable microservice foundation (Redis
read-offload, RabbitMQ fan-out sync, precomputed For-You feed, Socket.io realtime,
polyglot persistence). It does **not** yet move money and has no paying users —
the monetization layer is **designed, not built**.

## Services

| Service | Persistence | State |
|---|---|---|
| **video-service** | MongoDB (Prisma) | Fullest. Uploads (presigned direct-to-storage), explore + For-You + Following feeds, likes/comments, view tracking, RabbitMQ `video.created`/`video.deleted`. |
| **user-service** | PostgreSQL (Prisma) | Auth (Clerk), roles, follow graph, C-Score schema (implemented; scoring job **not built**), `last_active_at`. |
| **curation-service** | (Prisma) | Scaffolded ahead of deps: Collections + Following feed. Private-collection PRO gating is **bypassed** until marketplace ships (see roadmap known-debt). |
| **marketplace-service** | PostgreSQL (Prisma) | **Schema only, no `src/`.** Payments/Stripe unbuilt. This is the first-revenue gap. |
| **client** | Vite/React | Feed, network/social, profile, upload, collections UI. |

Cross-cutting: `docker-compose`, `k8s`, RabbitMQ fan-out, Redis, ADRs in
`docs/adr/`.

## Roadmap position (see roadmap §6)

- **Phase A** (auth/roles hardening) — in progress
- **Phase B** (Assets & Collections) — partial: Collections exist; `DigitalAsset`
  + embed import not built
- **Phase C–F** (marketplace payments, PRO, affiliate, C-Score job) — **not started**

## video-service model — current (branch `feature/video-service`)

Recently expanded from a bare upload record into a proper media model:

`hashtags, title, description, uploaded_at, updated_at,
uploaded_by{id,username,avatar_url}, video_url, thumbnail_url, source_type,
external_url, embed_id, category, software_used[], duration, width, height, fps,
file_size_bytes, processing_status, visibility, commentCount, likeCount,
view_count` + Comment/Like.

Shipped on this branch:
- **Metadata foundation:** description, thumbnail_url, duration/width/height, fps,
  updated_at, Uploader.avatar_url.
- **Visibility** enum (PUBLIC/UNLISTED/PRIVATE/DRAFT); all discovery surfaces
  (explore, For-You, Following, trending) filter to PUBLIC.
- **View tracking:** `view_count` + `POST /:id/view` (Redis-deduped per viewer,
  hourly), triggered client-side by a **3-second on-screen dwell**
  (`useViewTracker`, IntersectionObserver) — source-agnostic (works for embeds).
- **Studio & Radar:** `source_type` (+ `external_url`/`embed_id` embed
  groundwork), `software_used[]` with a controlled vocabulary (client+server),
  indexed for The Radar.
- **Discovery taxonomy:** single controlled-vocab `category` (primary discipline,
  client+server vocab, indexed; explore supports `type=category`) — the top-level
  discovery axis, distinct from hashtags and software_used.
- **processing_status** enum — now driven by the native media pipeline: uploads
  land `UPLOADED` and publish `video.uploaded`; the ffprobe/thumbnail worker
  (`mediaProcessingWorker`) writes trusted `duration/width/height/fps` +
  `thumbnail_url` and flips `PROCESSING → READY` (or `FAILED` → DLQ). See ADR 0002.
- **Hashtag normalization** — shared client/server sanitizer (split on
  whitespace/commas, strip `#`, lowercase, dedupe, cap), applied at write, search,
  client submit, and a data backfill.

## Known gaps / deferred (intentional)

- **Embed import + publish flow** — **built (manual)** on `feature/media-pipeline`:
  `POST /import` (URL → provider detect → oEmbed enrich → READY DRAFT), `PATCH
  /:id` (metadata), `POST /:id/publish` (DRAFT→PUBLIC, category-required +
  READY-gated), plus a 3-step client wizard (Import → Details → Review). Feeds
  gate on PUBLIC **+** READY, so drafts/processing/failed never surface.
  **Still open:** the cron auto-fetch job (connected-channel ingestion) and the
  asset-listing step (marketplace-service, schema-only). Native vs. embed
  lifecycle documented in **ADR 0002**.
- **C-Score scoring job** — schema implemented; nightly worker not built
  (`C_SCORE_CALCULATION.md`).
- **Velocity trending** — current trending is all-time `likeCount`; velocity
  (24h views/saves × creator C-Score) needs time-windowed view data + cross-service
  inputs.
- **Marketplace / payments** — the whole revenue layer (Phase C+).
- **Following feed fan-out-on-WRITE** — currently fan-out-on-READ; fine at typical
  follow counts (roadmap known-debt #3).

## Decided against (for the video model)

- `save_count` — saves live in curation-service; source from its snapshot, don't
  denormalize a drift-prone copy here.
- `share_count` — **not added at all** (not just kept out of C-Score). Today
  "share" is copy-link + email/WhatsApp/Twitter *intent* buttons
  (`components/Share.tsx`) — none report a verified share, so a counter would
  tally trivially-inflatable button clicks, not distribution. It's the
  inert-column trap; Mongo makes adding it later free, so there's no cost to
  waiting. If distribution should ever count, the correct mechanism is
  **referral attribution** — a share link carrying a token
  (`?ref=<curatorId|shareToken>`) and counting **verified visits/conversions**
  through it. That *is* the affiliate mechanism (roadmap Phase E), a money-backed
  signal that doubles as curator attribution — a raw `share_count` is a strictly
  worse proxy for it.
