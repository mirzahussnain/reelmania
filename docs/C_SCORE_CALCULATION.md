# C-Score — Calculation Design & Rationale

> Companion to `KINETIX_PRODUCTION_ROADMAP.md` (§5 C-Score) and `IMPLEMENTATION_PLAN.md`.
> This document is the **full design and reasoning** behind the Curation & Creator Score:
> the signals, the formula, the anti-gaming properties, the cold-start strategy, the job
> architecture, and the schema. It captures the design discussion step by step so the
> implementation has a single reference.

**Status:** design (not yet built). Schema fields and the scoring worker are scoped here;
no formula or weight is locked until v1 ships and we observe real distributions.

---

## 0. Guiding Principle

C-Score measures **trust and value created on the platform**, not vanity. Every design
choice below favors *actual value* (sales, curated taste, weighted network trust) over
*raw engagement* — because engagement is the easiest thing to fake, and the whole point of
the score is to resist algorithmic exploitation.

Two non-negotiables fall out of this:

1. **Money and curated taste outweigh raw engagement.**
2. **Anything imported from outside the platform must decay** — recognition on Day 1,
   earned on Day 30. A superstar who never participates must not sit at the top forever.

---

## 1. The Four Signals

| Signal | Meaning | Source service |
|---|---|---|
| **Sales authority** | asset sales count + volume (cents) | marketplace-service (`Order` where `status = PAID`, `sellerId = u`) |
| **Network resonance** | connections received, *weighted by the connector's own C-Score* | user-service (`followers`) |
| **Curation success** | sales driven *through your Vaults* as affiliate | marketplace-service (`Order.curatorId = u`) |
| **Engagement** | likes + comments on your uploads | video-service |

The two marketplace signals are `0` until the marketplace ships (see §8 Phasing); the
formula handles that gracefully without code changes.

---

## 2. The Formula (v1 heuristic)

Raw signals live on wildly different scales (a sale ≈ tens; likes ≈ thousands), so each is
**log-compressed**, weighted, summed, then the platform-wide result is mapped to the
**0–100 ring via percentile rank**.

```
raw(u) =  0.35 · [ log1p(salesCount) + log1p(salesVolumeUSD) ] / 2     // authority
        + 0.30 · networkResonance(u)                                   // PageRank-lite
        + 0.25 · log1p(affiliateSalesCount)                            // tastemaker
        + 0.10 · log1p(likes + 0.5 · comments)                         // engagement

cScore(u) = round( 100 · percentileRank( raw(u) over active users ) )
```

Weights sum to 1 and deliberately rank **money (0.35) + curation (0.25) > network (0.30)
> engagement (0.10)**. Engagement is weighted lowest so vanity metrics cannot inflate the
score.

> Weights are a starting point. Retune after observing the first real distribution; the
> ring reads `cScore`, so retuning is a job-config change, never a migration.

### 2.1 Why log-compression (`log1p`)

Dampens the **whale effect**. A creator with 10,000 likes is not 100× more valuable than
one with 100 likes. Log compression rewards exponential growth while protecting the
ecosystem from a single viral spike dominating the scale.

### 2.2 Why percentile rank (not min-max)

This is the most important normalization choice. With **min-max**, a single viral superstar
with 10M likes would compress 99% of users into a flat 0–5 band — the ring becomes
meaningless for everyday users. **Percentile rank** keeps the scale competitive and
legible: "you are in the Nth percentile of tastemakers." One whale cannot flatten everyone
else.

---

## 3. Network Resonance — "PageRank-lite"

A follow from a high-C-Score curator must count more than a follow from a throwaway
account. So the score is **recursive** (yours depends on your followers' scores), which a
single pass cannot resolve.

```
networkResonance(u) = Σ over followers f of  ( 0.15 + 0.85 · cScoreNorm(f) )
```

Resolve it like PageRank: **power iteration**, 3–5 passes per nightly run, **seeded from
the previous run's persisted scores** so it converges in a couple of iterations.

### 3.1 The anti-gaming property

The `0.15` baseline is the load-bearing term. If an attacker spins up 1,000 fake accounts
to follow themselves, each puppet has `cScoreNorm ≈ 0`, so each contributes only `~0.15`.
A bot farm moves the needle a fraction of a point. Trust can only be conferred by accounts
that already have trust — which they earned by transacting, not by existing.

### 3.2 Iteration hygiene

- **Normalize the vector after each pass** (divide by max, or L1-normalize) so the
  recursive term neither collapses toward 0 nor blows up across iterations.
- **Seed from yesterday's `cScore`**; on the very first run (none exists) seed from a cheap
  engagement pre-score (see §4), never uniform 0 — otherwise the network term degenerates to
  raw in-degree and becomes gameable on Day 1.

---

## 4. Cold Start — Internal

Because the ring uses **percentile rank**, absolute magnitudes on Day 1 don't matter for
display — even an all-baseline network term still spreads users across 0–100. The real risk
is degenerate **ordering**: if every `cScoreNorm(f) = 0`, the network term collapses to raw
in-degree (gameable follower count).

Handling:

1. **Seed the power iteration from an engagement pre-score on the first run.**
   `seed(u) = normalize( log1p(likes + 0.5 · comments) )`. Iteration #1 then already weights
   a connector by their engagement instead of flat `0.15`, so the network term carries real
   signal immediately and converges to the blended steady state over a few nightly runs.
2. **Normalize per iteration** (§3.2).
3. **No separate v1 weight set needed.** Sales/affiliate terms are `0` for *everyone*
   pre-marketplace, so they contribute equally and drop out of the *ordering* automatically.
   When the marketplace ships, the zeros become real and the same weights light up.

---

## 5. Cold Start — Off-Platform (Importing Fame)

An isolated-island algorithm insults imported talent: a 1M-subscriber YouTuber joins with
0 internal followers, scores terribly, feels insulted, and churns. The algorithm cannot be
blind to proven outside authority — **but imported fame must be a bounded, decaying prior,
not a permanent term**, or it undoes the value thesis (§0).

### 5.1 The decaying-prior model (unifies all seeding)

```
cScore(u) = blend(α) · internalScore(u)  +  (1 − α) · externalPrior(u)

α (trust in internal signal) ramps 0.2 → 0.95 as the user's internal
data accrues (account age + internal followers + sales).
```

`α` is the **"invisible shift"** made explicit and per-user:

- **Day 1:** `α ≈ 0.2` → score is mostly imported authority. They are recognized
  immediately, not started at zero.
- **Week 3–4:** `α ≈ 0.9` → the prior has faded; they are judged on Komorebi behavior.

The transition is automatic and invisible. A real creator has, by then, earned a real
internal score anyway. The rule, stated plainly: **recognition on Day 1, earned on Day 30.**

### 5.2 Source 1 — External platform authority (OAuth import)

- **YouTube only at launch.** `channels.list → statistics.subscriberCount` is free and
  trivial. **TikTok and Instagram are gated** (app review, Login Kit / Research API) — weeks
  of approval for a solo dev. Do not promise multi-platform; ship YouTube, defer the rest.
- **Verify ownership via OAuth**, never a pasted URL — otherwise anyone claims anyone's fame.
- Feed into `externalPrior`, **log-compressed and capped** (e.g. prior maxes at ~85th
  percentile, never 100). Imported fame buys *recognition and a head start*; the **top of the
  leaderboard is reserved for people who actually transact here.** This also bounds
  bought-subscriber gaming.

### 5.3 Source 2 — Founder whitelist / VIP (manual, ship first)

The cheapest, highest-leverage seeding — **zero external API**. Before public launch, recruit
10–20 respected editors with VIP early access ("a premium portfolio app that sells your
project files with zero friction").

- Set `is_founding_member` → a **score floor** (e.g. 80+) **and** a permanent
  "Founding Member" badge. (Distinct from `is_verified`, which is authenticity-only with no
  score effect — see §9.1.)
- **The score boost decays** (like the prior); the **badge stays permanent.** This gives the
  founding cohort the trust-routing role during Weeks 1–3 — so regular users who follow them
  have high-value nodes to route trust through — **without** minting a permanent aristocracy
  that demoralizes month-two joiners.

### 5.4 Source 3 — Engagement smoothing period

For the first 2–3 weeks internal follower counts are tiny and the PageRank graph barely
exists. Lean on **engagement + external prior** early; as users follow each other inside the
app, `α` automatically shifts reliance onto the internal "circle of trust." Same mechanism as
§5.1 — no extra code.

---

## 6. Job Architecture

```
[ Nightly trigger ]
        │
        ▼
[ Fetch snapshots ]  ← per-service metric snapshots over RabbitMQ / DB read-model
        │              (sales-per-seller, affiliate-per-curator, engagement-per-creator)
        ▼
[ Compute raw scores ]  (in worker memory)
        │
        ▼
[ Run 3–5 PageRank-lite iterations ]  (seeded from yesterday)
        │
        ▼
[ Apply external prior + α-blend + whitelist floor ]
        │
        ▼
[ Convert raw → percentile rank 0–100 ]
        │
        ▼
[ Batch write cScore + cScoreUpdatedAt back to users ]
```

Principles:

- **Scheduled, never on request.** A leaderboard metric, like trending. Computing recursive
  follower queries synchronously on profile load would lock the DB.
- **Idempotent / recompute-from-scratch each run.** If a bot farm is caught and purged during
  the day, the nightly run self-corrects the leaderboard with no compensating subtraction
  scripts.
- **Inputs arrive as nightly metric-snapshot events** (RabbitMQ) — consistent with the
  existing fanout-sync + denormalization patterns (ADR-0001). The scoring job is a *consumer*,
  not a new boundary.

### 6.1 Where it lives — NOT a separate service

The scoring job belongs as a **scheduled worker inside `user-service`**, not a standalone
microservice:

- **It owns no durable state of its own** — `cScore` lives on `users` (user-service's table).
  A separate service would either run a DB it doesn't own or reach across the boundary to
  write into user-service's Postgres (the cross-service-write anti-pattern marketplace-service
  is careful to avoid).
- **It serves no requests** — pure nightly batch, no endpoint for a "service" to expose.
- **Its two heaviest inputs already live here** — the `followers` graph and the `cScore`
  write target. PageRank-lite is an operation on user-service's own graph.
- **Cross-service inputs need a consumer, not a service** — sales/engagement arrive as the
  nightly snapshot events; user-service already runs RabbitMQ workers (`userWorker`).
- **Solo-dev tax:** a new service = another Dockerfile, K8s Deployment, CI target, secret
  set, DB URL, dashboard — to run one job a day. Pure overhead, zero isolation benefit.

**Compute isolation** (the one real concern) is solved on the **runtime/process axis, not the
service axis:**

- **Now:** a cron-triggered worker in the user-service codebase (`npm run score` /
  node-cron tick), sharing the Prisma client and schema.
- **At scale (100k–1M+ users):** promote to a Kubernetes **`CronJob` running the user-service
  image** with a different entrypoint (`node dist/jobs/cScore.js`). Separate pod → can't
  affect API latency, own memory limits, dies when done. **Still the same service, same code,
  same DB ownership.**

A separate **ranking-service** only earns its place at roadmap Phase F (leaderboards,
trending, recommendations with their own materialized read-models / analytics store). Until
then it's YAGNI.

---

## 7. Scale — Percentile Rank Without Locking Production

Rule: **never compute percentile inside a long production transaction.** Stage → compute →
batch-publish.

```
[ worker memory ]                         [ postgres ]
 load (userId, rawSignals) ──SELECT──►     active users
 compute raw + PageRank iterations
 sort raw[] once   O(n log n)
 percentile = binIndex / n   (binary search per user)
 write → cScore_staging   (bulk COPY)
 batched UPDATE users FROM cScore_staging   (1–5k rows / statement)
```

- **Bound `n` to active users** (activity in last *N* days). Often cuts the set 5–10×.
- **≤ ~50k users:** a single `PERCENT_RANK() OVER (ORDER BY raw)` window function over a
  staging table is milliseconds — don't over-engineer.
- **100k–1M+:** compute percentile **in the worker's memory** — load `(userId, raw)`, sort
  once, percentile = `position / n` via binary search. ~1M `(id, float)` pairs ≈ a few
  hundred MB, comfortable on a dedicated worker, zero DB contention. For memory-tight runs,
  swap the sorted array for a **t-digest** (tiny, streaming).
- **Atomic publish:** compute the full new column in staging, then publish in **small batched
  UPDATEs** (short locks) or a shadow-column swap — the ring always reads a consistent
  generation.

---

## 8. Phasing

| Phase | Available signals | Notes |
|---|---|---|
| **v1 (now, pre-marketplace)** | network resonance + engagement + external prior + whitelist | Sales/affiliate = 0 for everyone → drop out of ordering automatically. Ring is real, just money-blind. |
| **v2 (after roadmap Phase C)** | + sales authority + affiliate/curation | Same formula; the zeros become real and light up. No code change to the formula. |
| **Phase F** | leaderboards, decay tuning, possible ranking-service split | C-Score becomes input to enterprise recruiting (roadmap §6 Phase F). |

---

## 9. Schema (user-service / Postgres)

**Status: implemented** (migration `20260701000000_user_cscore_and_external_metrics`,
Postgres). Raw external counts are stored (auditable); `externalPrior`, `α`, and the
founding-member floor are computed **inside the job**, not at write time — so the decay
curve can be retuned without a migration.

Three status axes are kept **distinct** — never conflated (see §9.1):

```prisma
model users {
  // … existing fields …
  is_founding_member Boolean   @default(false)  // provenance; decaying C-Score seed floor + badge
  is_verified        Boolean   @default(false)  // authenticity mark only — NO score effect
  is_active          Boolean   @default(true)   // soft-disable; bounds the scoring pool
  c_score            Int       @default(0)       // the persisted percentile the ring reads
  c_score_raw        Float     @default(0)       // un-normalized; seeds next run's iteration
  c_score_updated_at DateTime?                   // freshness + job monitoring
}

// 1:1 side table (keeps the hot users row lean); YouTube only at launch.
model user_external_metrics {
  user_id            String   @unique
  youtube_channel_id String?  @unique
  youtube_followers  Int      @default(0)        // → externalPrior input
  youtube_view_count BigInt   @default(0)
  last_synced_at     DateTime @default(now())
}
```

The SVG ring (PublicProfile / Vault / NetworkRelations) simply reads `c_score`. No
computation on the client, ever.

### 9.1 Status axes & badges (never conflate)

| Axis | Nature | Storage |
|---|---|---|
| **Founding member** | provenance (early/hand-picked), immutable | `is_founding_member` — grants decaying seed floor + badge |
| **Verified** | authenticity, grantable to organically-grown stars too | `is_verified` — **cosmetic only, no score effect** so rank stays earned |
| **Earned status** (Top Curator, Rising, Bestseller…) | derived from c_score / followers / sales | **not stored** — computed as badges |

Badges are a **derived, pure function** over facts already on the profile payload
(`src/constants/badges.ts` → `deriveBadges`), not a table — O(rules) per user, one home for
every threshold, client is a dumb renderer. A stored `user_badges` table is only warranted
later for arbitrary admin-granted awards (event/campaign badges). v1 badges:
`Founding Member`, `Verified`, `Top Curator` (c_score ≥ 90), `Connected` (followers ≥ 50);
v2 adds `Creator/Seller`, `Bestseller`, `Rising` once marketplace + score history exist.

---

## 10. Anti-Gaming Summary

| Vector | Defense |
|---|---|
| Bot-farm self-follows | `0.15 + 0.85·cScoreNorm(f)` — zero-score puppets add ~baseline only (§3.1) |
| Viral spike / vanity likes | `log1p` compression + engagement weighted lowest (0.10) (§2.1) |
| One whale flattening the scale | percentile rank, not min-max (§2.2) |
| Bought external subscribers | external prior log-compressed, **capped < 100**, and **decays** (§5.2) |
| Permanent imported aristocracy | `α`-blend + decaying VIP boost; badge permanent, score earned (§5) |
| State drift after purging bots | idempotent recompute-from-scratch nightly (§6) |
| Self-referral affiliate | exclude `curatorId == sellerId` at order time (roadmap §4) |

---

## 11. Solo-Dev Build Order

1. **`is_founding_member` floor** — Day 1, no external API, immediate network seeding.
2. **`α`-blend + decay** in the scoring worker — makes all seeding transient; protects the
   value thesis.
3. **Scoring worker v1** — network resonance + engagement, staged in-memory compute, batched
   write-back, cron in user-service.
4. **YouTube OAuth import** → `external_followers` → prior — when onboarding outside talent.
5. **v2 money signals** — switch on after marketplace Phase C.
6. **TikTok / Instagram** — defer until there's a reason to fight their API gates.
7. **CronJob promotion / ranking-service** — only when run cost or leaderboards demand it.
