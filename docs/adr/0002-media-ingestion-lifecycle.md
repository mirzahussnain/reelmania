# ADR 0002 — Media ingestion & processing lifecycle (native uploads vs. embeds)

- **Status:** Accepted (fields shipped; native worker + embed import deferred)
- **Date:** 2026-07-05
- **Context phase:** KINETIX_PRODUCTION_ROADMAP Phase B (Assets & Collections),
  video-service schema expansion

## Context

A Kine's media can originate two ways, and they have fundamentally different
lifecycles:

1. **Native upload** — the creator's file lands in our own bucket (MinIO/S3) via
   a **presigned direct-to-storage PUT**. The bytes **never pass through the
   Node backend** — `createVideo` only persists metadata after the upload
   completes.
2. **Embed / auto-fetched** — a YouTube/TikTok/Vimeo video the creator *points
   at* (the free-tier "Dead Asset" import). We store **no bytes**; the media
   lives on the provider and is played through their iframe.

The schema carries both: `source_type` (`NATIVE|YOUTUBE|TIKTOK|VIMEO`),
`external_url` + `embed_id` for embeds, and media metadata
(`duration/width/height/fps`) plus a `processing_status`
(`UPLOADED|PROCESSING|READY|FAILED`). This ADR records how those fields are
populated per source, and why they differ.

The forcing question was PRO tier gating (**4K/60**): resolution + frame rate
must be **trusted**, so they cannot come from the client (spoofable to bypass
paid limits). That is straightforward for native files but impossible for embeds.

## Decision

Treat the two sources as **two distinct ingestion paths** that converge on the
same `videos` row.

### Native uploads — async, server-extracted, trust-at-READY

- The client currently probes `duration/width/height` from a `<video>` element
  for instant UX, **but these are not trusted.** The source of truth is a
  **post-upload worker** that runs **ffprobe** against the stored object to read
  `duration/width/height/fps` and extract a poster frame (`thumbnail_url`).
- Because the file goes straight to the bucket, ffprobe **cannot** run inline in
  the request — it is a **worker that pulls the object from storage**, not a
  request handler.
- Lifecycle: `createVideo` writes `processing_status = UPLOADED`
  (currently `READY`, see Status below) → worker sets `PROCESSING` → `READY`
  on success or `FAILED` on a bad/corrupt file.
- **PRO gating (4K/60) reads these fields only when `NATIVE` and `READY`.**

### Embeds — synchronous, provider-sourced, READY on create

- A separate import endpoint (e.g. `POST /videos/import`) extracts the provider
  + `embed_id`, calls the provider API **synchronously at import time**, and
  writes the row. **No storage, no ffprobe, no worker.**
- YouTube Data API (`part=snippet,contentDetails`) yields **`duration`**
  (ISO-8601 `PT1M30S` → seconds), a **`thumbnail_url`**, and title/description.
- `width`/`height` are only coarse (`definition: hd|sd`) and **`fps` is not
  provided at all** → left `null`.
- `processing_status = READY` immediately (nothing to process), or `FAILED` if
  the provider fetch fails (bad URL, private/removed video).
- **PRO gating does not apply to embeds** — they are showcase pointers, not
  sellable native assets — so `fps/width/height = null` on an embed is expected,
  not a gap. Gating branches on `source_type === "NATIVE"`.

### Shared downstream

- **Views** are source-agnostic: `POST /:id/view` + the 3s-dwell `useViewTracker`
  work for both. An embed drives the same endpoint from the provider Iframe API
  (`onStateChange` playing → 3s → fire).
- Everything reads `thumbnail_url`, `duration`, etc. without caring about source.

## Consequences

- **Positive:** trusted, un-spoofable media metadata for the one place it matters
  (native PRO gating); embeds cost one synchronous API call and no infra; the
  same `videos` row + view/feed machinery serves both.
- **Negative / follow-ups:**
  - The **native ffprobe/thumbnail worker is not built yet.** Until it is, native
    media metadata is client-probed and therefore **must not be wired to PRO
    gating.** `createVideo` currently marks native uploads `READY` immediately as
    a placeholder.
  - The **embed import endpoint + UI are not built** (Phase B).
  - Embeds need a **freshness/availability** concern the native path doesn't: a
    provider video can be deleted/privatised after import. That is handled later
    by a **periodic re-validation job** (re-hit the API, flip to `FAILED` if
    gone) — an *availability* lifecycle, **not** `processing_status` on write.
- **Revisit if:** we start selling embed-derived assets (would force a real
  quality signal on embeds), or add transcoding/quality variants (extends the
  native worker and the `PROCESSING` state).

## Status of the fields today

Shipped on the `feature/video-service` branch (schema + backfill):
`source_type`, `external_url`, `embed_id`, `duration`, `width`, `height`, `fps`,
`processing_status`, `thumbnail_url`. **Producers are partial:** native metadata
is client-probed (worker pending); embed import path is unbuilt. The fields are
the groundwork; the two ingestion workers are the remaining work.
