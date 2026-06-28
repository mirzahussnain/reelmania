# Messaging contract (RabbitMQ — inter-service events)

> Source of truth for **asynchronous, service-to-service** events. This is distinct
> from the user-facing live updates in [`realtime-contract.md`](./realtime-contract.md)
> (Socket.IO): that doc is browser ↔ video-service for live comments/likes; **this**
> doc is service ↔ service for eventual consistency across separate databases.
>
> Companion to [`ERD.html`](./ERD.html) (the soft-reference edges this messaging keeps
> consistent) and `KINETIX_PRODUCTION_ROADMAP.md` §2–4 (the money models).

---

## 1. Why this exists

The four services own **four separate databases** (user-service · Postgres,
video-service · Mongo, marketplace-service · Postgres, curation-service · Postgres). A
foreign key cannot cross a database boundary, so every cross-service reference is a **soft
link** — a bare id with no DB-level enforcement (e.g. `AssetVideoLink.videoId → videos.id`,
`CollectionItem.videoId → videos.id`). Integrity across
those edges is the *application's* job, and the mechanism is **events on RabbitMQ**:

- **Async propagation** (this doc) — "user renamed", "video deleted", "order paid".
- **Sync resolution** (NOT this doc) — resolved with internal REST when an id must be
  read *right now*. Kept rare via denormalization + batching. gRPC is **not** used
  (premature; revisit post-revenue — see roadmap).

---

## 2. Broker topology — ONE broker, per-service logical isolation

We run **a single shared RabbitMQ broker**, NOT one broker per service. A broker exists
to *connect* services; isolating brokers per service would require federation/shovel to
bridge them and defeat the purpose. Isolation comes from **topology ownership**, not
from separate brokers.

```
RabbitMQ broker
└── vhost: /kinetix
    ├── exchange: user.events         (topic)  ── published by user-service
    ├── exchange: video.events        (topic)  ── published by video-service
    ├── exchange: marketplace.events  (topic)  ── published by marketplace-service
    └── exchange: curation.events     (topic)  ── published by curation-service

    Consumers declare their OWN queues (+ a paired .dlq) and bind to the exchanges
    they care about:
    ├── marketplace.user-events.q   ← user.events   (user.deleted, user.updated)
    ├── marketplace.video-events.q  ← video.events  (video.deleted)
    ├── marketplace.curation-events.q ← curation.events (collection.item.added — affiliate/C-Score)
    ├── curation.user-events.q      ← user.events   (user.deleted)
    ├── curation.video-events.q     ← video.events  (video.deleted)
    └── video.subscription-events.q ← marketplace.events (subscription.updated)
```

**Ownership rules (the isolation guarantee):**
- A service **owns exactly one exchange** — its `<domain>.events` — and is the only
  publisher to it.
- A service **owns its consumer queues** — it declares, binds, and drains them. No other
  service touches another's queues.
- The `/kinetix` **vhost** namespaces everything and enables per-service publish/consume
  permissions later.

---

## 3. Event envelope (all services)

Every event shares one envelope. It lives in the shared contracts package
(`packages/contracts`, IMPLEMENTATION_PLAN §8.1) so publishers and consumers can't drift.

```ts
interface DomainEvent<T> {
  eventId:    string;   // uuid — idempotency key; consumers dedupe on this
  eventType:  string;   // routing key, e.g. "order.paid"
  occurredAt: string;   // ISO-8601
  version:    number;   // schema version, starts at 1
  data:       T;        // event-specific payload (below)
}
```

**Idempotency is mandatory.** Delivery is at-least-once and Stripe/Clerk webhooks
redeliver. Every consumer must dedupe on `eventId` (a `processed_events` table or a Redis
set with TTL) so a redelivered event is a harmless no-op.

---

## 4. marketplace-service — published events (exchange `marketplace.events`)

| Routing key | `data` payload | Primary consumers / purpose |
|---|---|---|
| `order.paid` | `{ orderId, buyerId, sellerId, assetId, amountCents, curatorId? }` | seller notification; analytics; affiliate-payout worker |
| `order.refunded` | `{ orderId, assetId, buyerId }` | revoke entitlement; claw back affiliate transfer |
| `entitlement.granted` | `{ buyerId, assetId, orderId }` | notifications; "your downloads" surface |
| `subscription.updated` | `{ userId, tier: "FREE" \| "PRO", status, currentPeriodEnd }` | **video-service** (gate 4K/60 uploads); user-service (PRO badge) |
| `asset.published` | `{ assetId, sellerId, videoIds: string[] }` | search indexing; flag linked videos "asset available" |
| `asset.unlisted` | `{ assetId }` | drop from search; hide cart affordance |

---

## 5. marketplace-service — consumed events

| Source · routing key | Queue (+ `.dlq`) | Handler intent |
|---|---|---|
| `video.events` · `video.deleted` | `marketplace.video-events.q` | **Unlink:** delete `AssetVideoLink` rows for that `videoId`. The asset survives. This is the orphan cleanup the soft link cannot do automatically. |
| `user.events` · `user.deleted` | `marketplace.user-events.q` | **Anonymize, never delete** (see §6): set the user's `DigitalAsset`s to `UNLISTED`; keep all financial rows. |
| `user.events` · `user.updated` | `marketplace.user-events.q` | Refresh denormalized seller display fields, *if* any are denormalized onto assets. |

---

## 6. curation-service — events

### Published (exchange `curation.events`)

| Routing key | `data` payload | Primary consumers / purpose |
|---|---|---|
| `collection.item.added` | `{ collectionId, videoId, addedById, ownerId }` | marketplace (affiliate context); C-Score job ("curation success" input, roadmap §5); notify the video's creator their work was curated |
| `collection.item.removed` | `{ collectionId, videoId }` | C-Score recompute; analytics |

### Consumed

| Source · routing key | Queue (+ `.dlq`) | Handler intent |
|---|---|---|
| `video.events` · `video.deleted` | `curation.video-events.q` | **Unlink:** delete `CollectionItem` rows for that `videoId` (orphan cleanup; the soft `videoId` ref can't cascade). |
| `user.events` · `user.deleted` | `curation.user-events.q` | Delete / anonymize that user's `Collection`s. Past **affiliate attribution already lives on `Order.curatorId` in marketplace**, so deleting collections does not erase sales history. |

**PRO gating note (not an event):** creating a private collection (`isPrivate = true`) is a
PRO perk, but tier lives in marketplace-service. curation-service learns tier by consuming
`marketplace.events · subscription.updated` (cache it) or a sync check at create-time — it
must **never trust the client** for tier.

---

## 7. The overriding rule: financial records are immutable

When `user.deleted` arrives, the handler **must NOT** cascade-delete `Order`,
`Entitlement`, or `PayoutAccount`. Those are financial/audit records and must persist:

- **Reconciliation** — Stripe balance vs. `Order` totals must match daily (roadmap §7).
- **Legal/tax** — a refund or chargeback can arrive *after* account deletion.
- **The counterparty** — the buyer on the other side of that order still holds a valid
  `Entitlement`.

So "delete user" in the **content** world ≠ "delete user" in the **money** world.
Marketplace responds by **unlisting for-sale inventory and anonymizing display fields**
while the transaction ledger stays intact. This different lifecycle is precisely why
money lives in its own service.

---

## 8. Reliability requirements (apply to every consumer)

- **Dead-letter queue per queue.** Each `*.q` has a paired `*.dlq` with a max-retry
  header; exhausted messages route to the DLQ. A poison message must never loop forever
  (the `userWorker.ts` `nack(..., requeue=true)` bug, IMPLEMENTATION_PLAN §2.2).
- **Webhook → verify → enqueue → worker writes.** External webhooks (Stripe, Clerk) are
  signature-verified, then enqueued; a worker performs the DB write. A provider retry
  storm must never corrupt state. Reuse the existing Clerk/Svix pattern.
- **Money writes are one transaction.** `Order.status = PAID` and `Entitlement` creation
  happen in a single Postgres transaction — both succeed or both fail.
- **DB-level idempotency backs the app-level dedupe:** `Order.stripeSessionId @unique`,
  `Entitlement(buyerId, assetId) @unique`, `Entitlement.orderId @unique` make a
  double-delivered payment a no-op rather than a double-grant.

---

## 9. Status

Build order:
1. `user.events` / `video.events` exchanges + DLQs (foundation).
2. marketplace-service consumers (`video.deleted` unlink, `user.deleted` anonymize);
   **curation-service consumers — DONE** (`video.deleted` unlink, `user.deleted` cleanup;
   `curation.video-events.q` / `curation.user-events.q`, each with a paired `.dlq`,
   bounded retries — `backend/curation-service/src/workers/videoWorker.ts`).
3. marketplace-service publishers (`order.paid`, `subscription.updated`) alongside the
   Stripe webhook handler; **curation-service publisher — DONE**
   (`collection.item.added` / `collection.item.removed` on `curation.events`).

> **Prerequisite still open:** video-service does not yet *publish* `video.deleted` to the
> `video.events` topic exchange. curation-service's consumer is built to the contract and
> will drain those events as soon as video-service emits them; until then the queue simply
> stays empty.
