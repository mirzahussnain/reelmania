# Kinetix — Production Roadmap (to Real Users & Revenue)

> Companion to `Kinetix_master_blueprint.md` (product vision) and `IMPLEMENTATION_PLAN.md`
> (code remediation). This document is the **path from the current codebase to a live,
> paying product**: data models, payments architecture, and the phase sequence to first dollar.

**Status as of 2026-06-23:** Architecture is sound and scalable (Redis read-offload,
RabbitMQ fanout sync, precomputed feed, polyglot persistence, Socket.io rooms). It is
**designed for scale, not yet proven at scale, and not yet monetized.** The work below
turns the prototype into a business.

---

## 0. Guiding Principle

The blueprint's monetization is *legally unassailable* precisely because Kinetix never
sells access to copyrighted video. **Revenue comes from selling digital assets the creator
owns** (project files, LUTs, presets) plus a SaaS subscription. Every technical decision
below protects that line: we move money for *file sales* and *subscriptions*, never for
*views*.

Sequence is deliberately revenue-first after the foundation: **Auth/roles → Assets →
Payments → Subscription → Curation/affiliate → Enterprise.** Each phase ends at a state
you could charge for.

---

## 1. Where We Are vs. What Revenue Requires

| Capability | Today | Needed for revenue |
|---|---|---|
| Identity & roles | Clerk auth, ad-hoc role checks | Hard role taxonomy + route guards (Phase 7 of impl plan) |
| Video upload | Direct-to-storage (MinIO/S3) | Keep; add **embed import** (YouTube/TikTok) for free tier |
| Collections / Vault | UI exists (Vault, FeaturedArchivesGrid) | Real **Collection** data model + ownership |
| Digital assets | ❌ none | **Asset** entity, secure storage, gated download |
| Payments | ❌ none | **Stripe Connect + Checkout + Billing** |
| Subscription (PRO) | ❌ none | Stripe Billing + entitlement gating |
| Affiliate attribution | ❌ none | Curator→sale attribution + payout split |
| C-Score | UI ring exists (PublicNetwork) | Real scoring job + persisted score |

---

## 2. Core Data Models (new)

These live in **user-service / PostgreSQL** (money, ownership, entitlements — relational,
ACID). Video/asset *metadata* stays in **video-service / MongoDB**; the **financial record
of truth is always Postgres.**

### 2.1 Creator payout account (Stripe Connect)
```prisma
model PayoutAccount {
  id                String   @id @default(cuid())
  userId            String   @unique          // Clerk user id
  stripeAccountId   String   @unique          // acct_...
  chargesEnabled    Boolean  @default(false)
  payoutsEnabled    Boolean  @default(false)
  onboardingDone    Boolean  @default(false)
  country           String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

### 2.2 Digital asset (the thing being sold)
```prisma
model DigitalAsset {
  id            String   @id @default(cuid())
  sellerId      String                       // Clerk user id of creator
  videoId       String?                      // optional link to the showcase video
  title         String
  description   String?
  priceCents    Int                          // store integer cents, never floats
  currency      String   @default("usd")
  storageKey    String                       // private bucket key (.zip / .aep / LUT)
  fileSizeBytes Int?
  status        AssetStatus @default(DRAFT)   // DRAFT | PUBLISHED | UNLISTED
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([sellerId])
  @@index([videoId])
}

enum AssetStatus { DRAFT PUBLISHED UNLISTED }
```

### 2.3 Order + entitlement (proof of purchase → download right)
```prisma
model Order {
  id                  String   @id @default(cuid())
  buyerId             String                   // Clerk user id
  assetId             String
  sellerId            String
  curatorId           String?                  // affiliate, if sold via a Vault
  amountCents         Int
  platformFeeCents    Int                      // 10% + $0.30
  affiliateCents      Int      @default(0)      // 15% of creator's net if curatorId set
  sellerNetCents      Int
  currency            String   @default("usd")
  stripeSessionId     String   @unique
  stripePaymentIntent String?
  status              OrderStatus @default(PENDING) // PENDING | PAID | REFUNDED
  createdAt           DateTime @default(now())

  @@index([buyerId])
  @@index([sellerId])
  @@index([curatorId])
}

enum OrderStatus { PENDING PAID REFUNDED }

// A buyer's right to download — created only after webhook confirms payment.
model Entitlement {
  id        String   @id @default(cuid())
  buyerId   String
  assetId   String
  orderId   String   @unique
  createdAt DateTime @default(now())

  @@unique([buyerId, assetId])
  @@index([buyerId])
}
```

### 2.4 Subscription (Kinetix PRO)
```prisma
model Subscription {
  id                   String   @id @default(cuid())
  userId               String   @unique
  stripeCustomerId     String   @unique
  stripeSubscriptionId String?  @unique
  tier                 Tier     @default(FREE)   // FREE | PRO
  status               String?                   // active | past_due | canceled ...
  currentPeriodEnd     DateTime?
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
}

enum Tier { FREE PRO }
```

### 2.5 Collection (the Vault as storefront)
```prisma
model Collection {
  id          String   @id @default(cuid())
  ownerId     String
  title       String
  slug        String
  isPrivate   Boolean  @default(false)  // private moodboards are a PRO perk
  createdAt   DateTime @default(now())

  @@unique([ownerId, slug])
  @@index([ownerId])
}

// Join: a video placed in a collection. The owner of a collection containing
// someone else's video becomes the affiliate (curatorId) for that asset's sales.
model CollectionItem {
  id           String   @id @default(cuid())
  collectionId String
  videoId      String
  addedById    String                  // = curator for affiliate attribution
  createdAt    DateTime @default(now())

  @@unique([collectionId, videoId])
  @@index([videoId])
}
```

---

## 3. Payments Architecture (Stripe)

Three Stripe products, one consistent pattern: **money on Stripe's side, truth in Postgres,
state changes only via verified webhooks.**

### 3.1 Marketplace sales — Stripe Connect (Express) + Checkout + `application_fee`
- Each creator onboards a **Connect Express** account (`PayoutAccount`). Kinetix never
  touches the creator's bank details — Stripe does KYC.
- Buyer purchases via **Checkout Session** created with:
  - `payment_intent_data.application_fee_amount = platformFeeCents (+ affiliateCents)`
  - `payment_intent_data.transfer_data.destination = seller's stripeAccountId`
- This is a **destination charge**: Stripe routes the seller's net directly to them, holds
  Kinetix's fee. For the affiliate cut, take a larger `application_fee` and pay the curator
  via a separate **Transfer** (or a second destination via Separate Charges & Transfers if
  splitting three ways).
- **Entitlement is created ONLY in the `checkout.session.completed` / `payment_intent.succeeded`
  webhook** — never on the client redirect. The success page just polls "do I have the
  entitlement yet?"

### 3.2 Secure asset delivery
- Asset files live in a **private** bucket (MinIO now, Cloudflare R2 for scale per blueprint).
- Download endpoint: verify `Entitlement(buyerId, assetId)` exists → issue a **short-lived
  pre-signed URL** (e.g. 5 min). The file is never public; the URL is per-request and expires.

### 3.3 Subscription — Stripe Billing
- PRO = a Billing **Price** ($8/mo). Checkout in `subscription` mode → `Subscription` row.
- Entitlements (`Tier.PRO`) updated from `customer.subscription.*` webhooks. **Never trust the
  client** for tier — gate features server-side off the `Subscription` table.
- PRO perks to gate: 4K/60 uploads, unlimited private Collections, 0% marketplace fee
  (set `platformFeeCents` accordingly at order time), custom domain (later).

### 3.4 Webhook integrity (non-negotiable)
- Verify Stripe signature on every webhook (you already do this pattern with Clerk/Svix).
- **Idempotency:** key off `stripeSessionId` / event id; a redelivered event must not
  double-create an `Entitlement` or double-count revenue. The `@unique` constraints above
  enforce this at the DB layer.
- Reuse the existing resilient pattern: webhook → verify → enqueue (RabbitMQ) → worker writes.
  A Stripe outage retry must never corrupt financial state.

---

## 4. The Affiliate Symbiosis (attribution)

The blueprint's growth engine: a curator who adds a creator's video to their Vault earns 15%
on sales made *through that Vault*.

- When a buyer reaches Checkout from a Collection view, carry the **`collectionId` →
  `curatorId`** through the session (`metadata` on the Checkout Session).
- At order creation, if `curatorId` is present and ≠ seller:
  - `affiliateCents = round(sellerGross * 0.15)` (curator's cut comes from creator's net,
    per blueprint — confirm the exact split policy before launch).
  - Record on `Order`; pay out via Stripe Transfer in the webhook.
- Edge cases to decide explicitly: self-referral (seller curates own video → no affiliate),
  multiple curators (first-touch vs last-touch — pick **last-touch from the Vault that drove
  the click**), refunds (claw back the transfer).

---

## 5. C-Score (Curation & Creator Score)

The UI ring already exists (PublicNetwork). Make the number real and persisted.

- Add `cScore Int @default(0)` to the user/profile table (Postgres).
- Compute in a **scheduled job** (not on request) — it's a leaderboard metric, like trending.
  Inputs (v1, heuristic — same philosophy as the For You feed: ship a smart heuristic, not ML):
  - Asset sales volume & count (creator authority)
  - Connections received (network resonance, weighted by connector's own C-Score — PageRank-lite)
  - Curation success: sales driven *through* your Vault as affiliate (tastemaker signal)
  - Engagement on uploads
- Persist the score; the SVG ring just reads it. Recompute nightly. This becomes the input to
  **Phase-3 enterprise recruiting** (C-Score Leaderboards).

---

## 6. Phase Sequence to Revenue

> Finish the in-flight code remediation phases (3.7 → 9) **in parallel with / before** the
> revenue phases below — clean roles, types, and primitives are prerequisites, not optional.

### Phase A — Foundation hardening (blocks everything money-related)
- Complete impl-plan **Phase 7 (Auth/roles)**: `RoleProtectedRoute`, real role taxonomy
  (`viewer | creator | curator | admin`), fix `checkRole` misuse. You cannot gate paid
  features without trustworthy server-side roles.
- Complete **Phase 8 (types)** for the new financial contracts — money code must be strict,
  no `any` near cents.
- **Outcome:** trustworthy identity + entitlement substrate.

### Phase B — Assets & Collections (inventory before checkout)
- `DigitalAsset`, `Collection`, `CollectionItem` models + CRUD.
- Private-bucket upload for asset files; Vault UI wired to real Collections.
- Embed import (YouTube/TikTok) for the free-tier "Dead Asset" pitch — auto-drafts a product
  page the creator attaches an `.aep`/`.zip` to.
- **Outcome:** creators have something to sell; nothing charges yet.

### Phase C — Marketplace payments (FIRST DOLLAR)
- Stripe Connect onboarding (`PayoutAccount`).
- Checkout (destination charge) → webhook → `Order` + `Entitlement`.
- Secure pre-signed download gated on `Entitlement`.
- **Outcome:** a creator can sell a project file and get paid. Kinetix takes its 10% + $0.30.
  **This is the milestone that makes Kinetix a business.**

### Phase D — Kinetix PRO (recurring revenue)
- Stripe Billing $8/mo, `Subscription` model, server-side PRO gating.
- Apply 0% marketplace fee for PRO, unlock private Collections + 4K uploads.
- **Outcome:** predictable MRR on top of transactional GMV.

### Phase E — Affiliate symbiosis (growth flywheel)
- Curator attribution through Vaults, 15% transfer in webhook, refund claw-back.
- **Outcome:** every curator becomes an unpaid sales force — the blueprint's distribution engine.

### Phase F — C-Score + Enterprise (Phase 3 of blueprint)
- Real scheduled C-Score job; leaderboards.
- Enterprise tier ($500/mo) for studio recruiting access.
- **Outcome:** B2B revenue layered on the creator economy.

### Known implementation debt (curation-service scaffold)
Tracked gaps from standing up `curation-service` ahead of its dependencies:

1. **Private-collection PRO gating bypass** — `createCollection`/`updateCollection`
   accept `isPrivate` straight from the request body with no tier check. Tier lives in
   marketplace-service, so this can only be closed in **Phase D**: consume
   `marketplace.events:subscription.updated` (cache tier) or a sync REST tier-check at
   create/update time. Until then, `isPrivate` is effectively ungated — **never ship
   paid gating on this without the check** (messaging-contract §6).
2. ~~**`video.deleted` not emitted**~~ — **DONE.** video-service now publishes
   `video.deleted` to the `video.events` topic exchange from `deleteVideo`, and
   curation-service unlinks the orphaned `CollectionItem` rows. (marketplace-service's
   own `video.deleted` unlink consumer still pending — messaging-contract §5.)
3. **Following feed is fan-out-on-READ (deferred scaling work)** — `getFollowingFeed`
   resolves the caller's follow-set (cached in Redis, busted by the `follow.changed`
   event) and does a cursor-paginated `uploaded_by.id $in [...]` query with a
   `FOLLOWING_FANOUT_CAP` guardrail. This is correct + cheap at typical follow counts,
   but degrades for power-users following tens of thousands against a huge corpus (large
   `$in` + in-memory merge-sort, Mongo's 32MB sort ceiling). **Endgame = fan-out-on-WRITE:**
   on `video.created`, push the videoId into each follower's precomputed Redis feed
   (mirrors the For You queue) so the read becomes an O(K) `LRANGE`, with a **hybrid pull
   for celebrity creators** (huge follower counts) to avoid write amplification — the
   Twitter/IG model. Deferred until real power-user load justifies the write-path
   complexity; the `follow.changed` event + follow-set cache are the groundwork.

---

## 7. Pre-Launch Checklist (the unglamorous, mandatory parts)

Money + real users raise the bar from "side project" to "I am liable":
- **Legal:** Terms of Service, Privacy Policy, marketplace seller agreement, refund policy.
  Stripe Connect requires a clear ToS. Tax handling (Stripe Tax) for cross-border sales.
- **Observability (impl-plan Phase 9):** you cannot run a payments system blind. Structured
  logs, error tracking (Sentry), uptime + webhook-failure alerts. Reconciliation job:
  Stripe balance vs. `Order` totals must match daily.
- **Security:** the asset bucket is private; pre-signed URLs short-lived; webhook signatures
  verified; rate-limit the download endpoint. No entitlement → no bytes, ever.
- **Idempotency everywhere money moves** (enforced by the `@unique` constraints in §2).
- **The Trojan Horse launch (blueprint):** invite-only, lifetime PRO for the top ~100 editors
  to seed supply before opening the B2C side. Don't open marketplace to the public until
  Phases A–C are battle-tested with friendly users.

---

## 8. The Honest Line (carry it into investor/recruiter conversations)

Kinetix today is a **well-architected prototype**: it scales on paper and survives a laptop
load test. It does **not** yet move money, has no paying users, and the monetization layer
above is **designed, not built.** The roadmap is sequenced so the *first revenue milestone
(Phase C) is reachable without rebuilding anything* — the marketplace bolts onto the existing
microservice + webhook + storage architecture. That's the whole point of having done the
scalability work first: the foundation is paid for, so the next phase is features, not rewrites.
