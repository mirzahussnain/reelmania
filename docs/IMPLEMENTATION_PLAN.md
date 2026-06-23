# ReelMania — Complete Remediation & Refactor Plan

> Scope: full‑stack audit of `client`, `backend/user-service`, `backend/video-service`.
> Goal: every issue found during the audit has a concrete, sequenced fix here — nothing is left implicit.
> Status legend: 🔴 correctness/security bug · 🟠 scalability/perf · 🟡 maintainability/DRY · 🔵 design‑system/consistency.

---

## 0. How to use this document
- Phases are ordered by dependency and risk. Each phase is an independently shippable PR.
- Suggested branch-per-phase off `refactor/semantic-tokens` (or a fresh `develop`).
- "Acceptance" lines are the definition of done; treat them as the PR checklist.
- Effort is a rough dev estimate, not a commitment.

Dependency graph:
```
P0 ─┬─ P1 ─ P2 ─┐
    ├─ P3 ───────┤
    ├─ P4 ───────┼─ P7 ─ P8 ─ P9
    └─ P5 ─ P6 ──┘
```

---

## Phase 0 — Cleanup & hygiene  (½ day, low risk)

**Goal:** remove dead code and noise so later diffs are meaningful.

| # | Issue | Action |
|---|-------|--------|
| 0.1 | 🟡 Dead component `DesktopNavItem.tsx` (never imported) | Delete `client/src/shared/components/navbar/DesktopNavItem.tsx`. |
| 0.2 | 🟡 Empty placeholder `FeaturedArchivesGrid.tsx` | Delete `client/src/shared/components/profile/FeaturedArchivesGrid.tsx`. |
| 0.3 | 🟡 Dead slice `uploaderSlice` (`setUploadProgress` never dispatched) | Either wire real upload progress in `useVideoUpload` or delete the slice + its store registration. Decision: **delete** (S3 PUT via `fetch` has no progress events anyway; use `XMLHttpRequest` later if progress is wanted). |
| 0.4 | 🔵 Brand-name inconsistency: "Komorebi" vs "ReelMania" | Add `client/src/shared/constants/brand.ts` → `export const BRAND = "ReelMania";`. Replace the literal in `PublicProfile.tsx:41` and the toast copy. |
| 0.5 | 🟡 `console.log` left in production paths | Remove logs in `useVideoRealtime.ts` (lines 37, 40, 44), `videoApi.ts:141`, `socketController.ts:18`. Add an eslint `no-console` warn rule (allow `warn`/`error`). |
| 0.6 | 🟡 LF/CRLF churn on commit | Add `.gitattributes` with `* text=auto eol=lf` and renormalize (`git add --renormalize .`). |

**Acceptance:** app builds; `git grep -n Komorebi` empty; no `console.log` in `src`; no unused-export warnings for the deleted modules.

---

## Phase 1 — Backend data‑layer correctness & scalability  (2–3 days)

**Goal:** fix the count/query bugs and make per‑entity reads scale. Depends on: P0.

### 1.1 🟠 `getUserVideos` is unbounded + unindexed
`backend/video-service/src/controllers/videoController.ts:116-151` does `findMany({ where: { uploaded_by: { is: { id }}}})` with **no pagination and no index** on the embedded `uploaded_by.id`.
- Add index in `backend/video-service/prisma/schema.prisma`:
  ```prisma
  model videos {
    // ...
    @@index([uploaded_at(sort: Desc), id])
    @@index([hashtags])
    @@index([uploaded_by.id, uploaded_at(sort: Desc)]) // NEW
  }
  ```
  (MongoDB supports indexing embedded-document fields; verify Prisma emits it, else add a manual Mongo index via migration script.)
- Add cursor pagination identical to `getVideos` (`cursor`, `limit`, `nextCursor`).
- Return `{ videos: [], nextCursor }` shape consistently (today it returns `videos: null` on empty — see 1.5).

### 1.2 🟠 `updateLikes` refetches **all** likes on every toggle
`videoController.ts:429-431` `findMany` of every like for the video on each like/unlike — O(N) per click.
- Stop returning the full like list. Return `{ videoId, likeCount, liked: boolean }`.
- Update the socket payload (Phase 2) and clients (Phase 3) to consume counts, not arrays.
- Keep a separate paginated `getLikesByVideoId` for the "who liked" UI.

### 1.3 🔴 Denormalized counters are not transactional (drift risk)
`addNewComment` (`:338-355`) and `updateLikes` (`:402-427`) do create/delete then a separate `videos.update({ increment })`. A failure between the two permanently desyncs `commentCount`/`likeCount`.
- MongoDB multi-document transactions require a replica set. **Confirm the deployment runs Mongo as a replica set** (check `docker-compose.yaml`); if yes, wrap each pair in `prisma.$transaction([...])`.
- If single-node Mongo (no transactions): make the count derivable/repairable — add a scheduled reconciliation job (`scripts/reconcileCounts.ts`) that recomputes `commentCount`/`likeCount` from the collections, and document that counters are eventually-consistent.

### 1.4 🔴 Like create/check race
`updateLikes` does `findUnique` then `create` (`:391-421`). Concurrent double-likes rely solely on the `@@unique([videoId, userId])` constraint, but the count increment isn't guarded.
- Replace read-then-write with an idempotent upsert/delete and derive the increment from whether a row actually changed:
  ```ts
  // pseudo: use deleteMany/createMany return counts to decide increment delta
  ```
- Combine with 1.3's transaction.

### 1.5 🟡 Inconsistent response envelopes
Mixed shapes across controllers: `res.send(string)` on errors, `videos: null` vs `videos: []`, `body` vs `result` vs `data` vs `video(s)`.
- Define one envelope: `{ success: boolean, message: string, data: T | null, meta?: { nextCursor, page, limit } }`.
- Create `backend/*/src/utils/http.ts` with `ok(res, data, meta?)` / `fail(res, status, message, err?)` helpers and migrate all controllers in both services.

### 1.6 🟠 `getUsers` offset pagination vs cursor elsewhere
`userController.ts:6-29` uses `skip=(page-1)*limit` (degrades on deep pages) while videos use cursors.
- Standardize on cursor pagination for list endpoints (followers list too). Document offset as acceptable only for admin tables.

### 1.7 🟡 Missing `getUserByUsername` endpoint (root cause of a client anti‑pattern)
`username` is `@unique` (indexed) but there's no lookup-by-username route, so the client downloads **all** users to resolve a profile.
- Add `GET /api/users/by-username/:username` → `findUnique({ where: { username }, include: { _count }})`. Reuse the `getUser` projection.

### 1.8 🟡 `q`/title search is a collection scan
`getVideos` uses `title: { contains, mode: insensitive }`.
- Add a MongoDB text index on `title` (and optionally `hashtags`) and switch search to `$text`, or document the current behavior as "small dataset only" with a follow-up ticket.

**Acceptance:** per-user video and follower reads are paginated and index-backed; like toggling is O(1) writes + O(1) response; counters provably cannot drift (transaction) or are auto-reconciled; one response envelope across both services; `by-username` endpoint live with an integration test.

---

## Phase 2 — Cross‑service consistency & realtime  (2 days)

**Goal:** fix stale duplicated user data and the broken socket layer. Depends on: P1.

### 2.1 🔴 Stale denormalized user data across services
`username`/`avatar_url` are copied into video-service: `videos.uploaded_by` (`Uploader`), and every `Comment`/`Like` row. The RabbitMQ worker (`userWorker.ts`) only handles **Clerk → user-service** events (`user_webhook_queue`). Nothing propagates profile edits to video-service, so old videos/comments show stale name/avatar.
- Publish a `user.updated` / `user.deleted` event from user-service (`UserService.updateUser`/`deleteUser`) onto a fan-out exchange.
- Add a consumer in video-service that back-fills `videos.uploaded_by`, `Comment`, `Like` for that `userId`.
- **Alternative (preferred long-term):** stop storing `username`/`avatar_url` on `Comment`/`Like`; store only `userId` and resolve display fields at read time (or via a short-TTL cache). Decide and record the choice in `docs/adr/0001-user-denormalization.md`.

### 2.2 🔴 RabbitMQ worker has no dead‑letter queue (poison‑message loop)
`userWorker.ts:47` `nack(msg, false, true)` requeues forever on a bad message.
- Declare a DLX/DLQ; set a max-retry header and route exhausted messages to the DLQ. Add structured logging.

### 2.3 🔴 Socket server: `disconnect` registered on `io`, not `socket`
`socketController.ts:17` `io.on('disconnect', …)` inside the `connection` handler adds a new global listener per connection → listener leak.
- Change to `socket.on('disconnect', …)`.

### 2.4 🟠 Server broadcasts every event to every client (no rooms)
`socket.broadcast.emit('newCommentAdded' | 'likesChange', …)` fans out all events to all sockets; clients filter by `videoId`. O(clients × events).
- Use rooms: client `socket.emit('joinVideo', videoId)` → `socket.join(videoId)`; server emits with `io.to(videoId).emit(...)`. Leave the room on unmount.

### 2.5 🟡 Stringly‑typed event contract duplicated client+server
Event names (`newComment`, `newCommentAdded`, `likeUpdated`, `likesChange`) are hardcoded in `videoApi.ts`, three hooks, and `socketController.ts`.
- Create a shared constants module (publish a tiny `@reelmania/contracts` package, or duplicate a single `socketEvents.ts` in each side) and import everywhere.

### 2.6 🔴 Client socket lifecycle is broken (singleton + per‑hook disconnect)
`socket.ts` exports a module singleton; `useComments`, `useVideoInfo`, `useVideoRealtime` each call `connectSocket(token)` **on every render** and each calls `socket.disconnect()` in cleanup. On `VideoInfo` (which mounts `useVideoInfo` + `useComments`) the hooks fight over the shared socket; one unmount disconnects it for the others.
- Introduce a single `SocketProvider` (React context) that owns one connection for the app, exposes `useSocket()`, and connects/disconnects once.
- Hooks subscribe/unsubscribe to *events* (and join/leave rooms) — they must **never** call `disconnect()`.
- Memoize: remove `const socket = connectSocket(token)` from render bodies.

**Acceptance:** editing a profile updates name/avatar everywhere within one event cycle (or display fields are resolved at read time); poison messages land in a DLQ; a client only receives events for videos it's viewing; exactly one socket connection exists regardless of how many video hooks are mounted; no event-name string literals outside the contracts module.

---

## Phase 3 — Client data layer, state & hooks  (3 days)

**Goal:** use the right endpoints, fix Redux/persist, and consolidate the overlapping video hooks. Depends on: P1 (endpoints), P2 (socket provider).

### 3.1 🔴 redux‑persist key collision
`store.ts:14-22` reuses `key: "root"` for **three** separate `persistReducer`s (video, user, auth). All write to `persist:root` in `localStorage` and clobber each other.
- Give each persisted reducer a unique key (`user`, `auth`) — or, better, use a single root `persistReducer` with a `whitelist`.
- **Do not persist the `video` slice** (feed is server data; stale on reload) and **do not persist `auth.token`** (see 3.2).

### 3.2 🔴 Auth token persisted to localStorage
`auth` slice (Clerk JWT) is persisted. Tokens in `localStorage` are XSS-exfiltratable and the app already refreshes the token every 30s via Clerk (`App.tsx:79`).
- Remove `auth` from persistence; rely on Clerk's session + the in-memory slice. Drop `clearToken`/`setToken` persistence.

### 3.3 🟡 `serializableCheck` config is wrong/stale
`store.ts:38-40` ignores only `persist/PERSIST`,`persist/REHYDRATE` and an unused `ignoredPaths:["register"]`.
- Ignore the full redux-persist action set: `FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER`; remove the bogus `register` path.

### 3.4 🟠🟡 Replace "fetch‑all + client filter" with real endpoints
- `Vault.tsx:32-50` and `useUserProfile.ts:51-66` use `useLazyFetchAllVideosQuery` + `.filter(username)` → switch to existing `useFetchUserVideosQuery` (`GET /videos/user/:id`, now paginated from 1.1).
- `useUserProfile.ts:34-44` downloads **all** users to find one by username → switch to `getUserByUsername` (1.7).
- Follow status: use `useCheckUserFollowerQuery` (O(1)) instead of pulling the full follower list (`useUserProfile.ts:69-74`, `useVideoInfo.ts:131-141`).

### 3.5 🟡 Consolidate overlapping video hooks
Three hooks overlap: `useComments` (comments+socket), `useVideoRealtime` (likes+comments+socket), `useVideoInfo` (video+likes+followers+socket). `PlayerCard` uses `useVideoRealtime`; `VideoInfo` uses `useVideoInfo`+`useComments`.
- Refactor into composable units that share the `SocketProvider`:
  - `useVideoLikes(videoId)` — like state/count + live updates.
  - `useVideoComments(videoId)` — comment list + live updates + post.
  - `useFollow(targetUserId)` — follow status/toggle (used by VideoInfo + profiles).
  - `useVideoDetails(videoId)` — fetch video + uploader.
- `PlayerCard` and `VideoInfo` compose these; delete `useVideoRealtime` and the redundant pieces of `useVideoInfo`/`useComments`.

### 3.6 🔴 `useVideoInfo` effect dependency bugs
`useVideoInfo.ts:113-129` `initData` runs on `[videoId]` only while reading `videoState`/`user` → stale closures; also `useState(useAppSelector(...))` (line 25) snapshots store state once and never updates.
- Fix dependency arrays; derive `user` directly from the selector (don't copy into local state); split effects by concern (folds into 3.5).

### 3.7 🟡 `filteredVideo` slice vs RTK Query cache
`SearchBar` keeps `exploreVideos` + `filteredVideo` in Redux, duplicating RTK Query's `fetchAllVideos` cache.
- Drive search off the RTK Query endpoint (`fetchAllVideos` already accepts `q`/`type`); remove `filteredVideo` slice and the `exploreVideos` duplication, or keep one and delete the other. Decision: **remove `filteredVideo`**, use query args.

### 3.8 🟡 Centralize auth/identity access
`storeHooks`, `useAppSelector(state.user)`, and Clerk `useUser` are interleaved ad-hoc.
- Add `useCurrentUser()` returning `{ user, token, isSignedIn }` from one place; replace scattered selectors.

**Acceptance:** localStorage shows distinct `persist:user` (no `auth`, no `video`); no "fetch all then filter" remains (`git grep fetchAllVideos` only in feed/search); one socket; video pages use the composable hooks; serializable-check console is clean.

---

## Phase 4 — Routing & navigation single source of truth  (1 day)

**Goal:** one place defines routes, layout behavior, and nav. Depends on: P0.

### 4.1 🟡 Two route-registration patterns
`routeLoader.ts` lazy-maps ~12 routes; `App.tsx:49-52` *also* inline-`lazy()`s Vault/NetworkRelations/PublicProfile/PublicNetwork.
- Create `client/src/app/routes.config.ts`:
  ```ts
  export interface AppRoute {
    path: string;
    component: React.LazyExoticComponent<React.FC>;
    layout: 'app' | 'standalone';
    access: 'public' | 'auth' | 'role:admin';
    nav?: { label: string; icon: IconType; activeIcon: IconType; group: 'primary'|'library' };
  }
  ```
- Generate `<Routes>`, the lazy map, and guards from this array.

### 4.2 🟡 Layout/standalone logic uses magic strings (duplicated)
`Layout.tsx:17-21` and `Navbar.tsx:20` both hardcode `pathname.includes("/sign-in" | "/share/...")`.
- Drive standalone detection from `routes.config.ts` `layout` field; delete the string checks.

### 4.3 🟡 Desktop vs mobile nav diverge
`Sidebar.tsx:81-87` (Home/Explore/Studio/Vault/History/Liked) ≠ `Navbar.tsx:32-36` (Home/Explore/Manage/User). Vault is unreachable on mobile.
- Derive both navbars from the `nav` metadata in `routes.config.ts`. Reconcile the intended destinations with product (note: Studio/History/Liked currently all point to `ComingSoon`).

### 4.4 🔵 `bg-surface` vs `bg-background` used interchangeably
Same hex today, but semantically ambiguous across pages.
- Pick one meaning (e.g., `background` = app shell, `surface` = panels) or alias; apply consistently. Use the `page-shell` utility everywhere a full page scroll container is needed (UserProfile already does; Vault/PublicProfile don't).

**Acceptance:** adding a route requires editing only `routes.config.ts`; no `pathname.includes` in `Layout`/`Navbar`; both navbars render from one source; every page uses a consistent shell utility.

---

## Phase 5 — Shared component primitives  (2–3 days)

**Goal:** eliminate the 50 raw `<button>`s and 3–4 duplicated card blocks. Depends on: P3 (data shape), P4 (nav).

### 5.1 🟡 No `Button` primitive (50 raw buttons / 24 files)
- Build `client/src/shared/components/ui/Button.tsx` with variants mapping to existing utilities: `primary` (`bg-primary text-on-primary glow-primary`), `secondary`, `ghost`, `pill` (`pill-btn`), `icon` (`action-circle`), plus `size` and `loading`/`disabled`.
- Migrate buttons incrementally; start with high-traffic (Vault, VideoActions, Topbar, Navbar, auth pages).

### 5.2 🟡 Video card markup duplicated
`Vault.tsx:200-227`, `UserVideoGrid.tsx:29-74`, legacy `VideoCard.tsx`.
- Build `VideoThumbnailCard` with props: `video`, `onClick`, `variant` (`grid`|`featured`|`vault`), `badges`. Use real `likeCount`/`commentCount` (see 5.4).
- Replace all three usages; delete `components/VideoCard.tsx` after `ManageVideos` migration (Phase 6).

### 5.3 🟡 Profile header duplicated
`Vault.tsx:110-174` inline profile card vs `UserProfileHeader` component used by UserProfile/PublicProfile.
- Make Vault reuse `UserProfileHeader` (extend it with the Vault actions via props/slots).

### 5.4 🔴 Mock data in UI
`UserVideoGrid.tsx:50` `Math.random()` view counts; `Vault.tsx:156` hardcoded `89k` C‑Score; `Vault.tsx:213` `00:15` duration; `UserVideoGrid` "Must Watch" static badge.
- Replace with real `likeCount`/`commentCount`. For genuinely unmodeled values (C‑Score, duration), either model them (duration at upload; C‑Score in a future service) or hide them — **do not ship fake numbers**. Track C‑Score as a separate backlog item.

### 5.5 🟡 Other repeated primitives
- `EmptyState` (used by Vault, UserVideoGrid, ManageVideos "no videos").
- `StatBlock` (Vault stats + profile header stats).
- `Avatar` (with verified/online badge — duplicated in Vault, AvatarConnectBadge, headers).
- Build these in `shared/components/ui/` and adopt.

**Acceptance:** `git grep "<button"` only inside `Button.tsx`; one video-card component; Vault uses `UserProfileHeader`; no `Math.random`/hardcoded counts in components.

---

## Phase 6 — Design‑token adoption & color consistency  (1.5–2 days)

**Goal:** make `index.css` the *enforced* single source of truth. Depends on: P5 (so legacy files are touched once).

### 6.1 🔵 `white/x` bypasses outline tokens (16 occurrences, 8 files)
`border-white/10`, `bg-white/5`, etc. in `Vault`, `UserVideoGrid`, `UploadVideo` (×7), `PublicProfile`, `PublicNetwork`, `Navbar`, `ManageVideos`.
- Replace with `outline-variant` token utilities (`border-outline-variant/20`, etc.).

### 6.2 🔵 Legacy palette pages opt out of tokens entirely
`Admin`, `ManageVideos`, `NotFound`, `SignIn`, `SignUp`, `Share`, `VideoCard` use `zinc/red/blue/gray/black/white`.
- Refactor each onto semantic tokens + the new `Button`/`Card` primitives.

### 6.3 🔵 `index.css` hardcodes colors it has tokens for
- `card-glass-panel` (`index.css:171-173`) uses raw `rgba` → switch to `color-mix` on `--color-surface-container` / `--color-outline-variant` (match the other card variants).
- `text-glow-primary` / `border-glow-primary` (`:283,287`) hardcode `rgba(208,188,255,…)` → use `var(--color-primary)` via `color-mix`.
- `AvatarConnectBadge.tsx:70` `drop-shadow-[…rgba(208,188,255,1)]` → token-based glow utility.

### 6.4 🔵 Unused scales: adopt or delete
`--spacing-*` and `--z-*` are defined but components use Tailwind defaults and raw `z-50`.
- Either replace raw `z-50`/`z-10` with `z-overlay`/`z-modal`/`z-dropdown` and adopt spacing tokens, or remove the unused scales. Decision: **adopt z-index scale** (real stacking bugs are likely), **delete spacing scale** (Tailwind spacing is sufficient).

### 6.5 🔵 Enforcement
- Add an eslint rule / stylelint or a CI `git grep` guard that fails on `#hex`, `rgba(`, `-white/`, and raw palette classes in `client/src/**/*.tsx` (allowlist `index.css`).

**Acceptance:** `git grep -nE '(#[0-9a-fA-F]{3,8}|rgba\(|-white/|-(zinc|gray|red|blue|slate)-)' client/src` returns nothing outside `index.css`; CI guard in place.

---

## Phase 6.5 — Feed scalability  (½–1 day, backend-only)

**Goal:** keep the Redis-backed feed scalable under many concurrent users. The
two feed paths (Redis-cached guest `getVideos`, per-user Redis queue
`getForYouFeed`) are sound, but `generateFeedForUser` has hot-path waste.

### 6.5.1 🟠 Trending recomputed per-user with an unindexed scan
`feedController.ts:70` runs `videos.findMany({ orderBy: { likeCount: 'desc' }, take: 50 })` on every replenishment fallback, and `likeCount` had no index.
- Add `@@index([likeCount(sort: Desc)])` (done).
- Compute trending **once** into a shared Redis list (`trending:videoIds`, ~5min TTL) and have every user's fallback read that instead of scanning the collection.

### 6.5.2 🟠 No concurrency guard on generation
`feedController.ts:109` fires `generateFeedForUser` un-awaited; rapid requests spawn overlapping generations.
- Guard with a per-user Redis lock (`SET <feedKey>:lock NX EX 30`); skip if already running.

### 6.5.3 🟡 No cross-run dedup → repeats in feed
Replenishment excludes recently-interacted videos but not ids already queued.
- Before `rPush`, filter out ids already present in the queue (`lRange`).

**Acceptance:** trending is a single cached computation shared across users;
concurrent replenishments don't duplicate work; the feed queue has no repeats.
NOTE: needs Redis running; verify against the broker/cache.

---

## Phase 7 — Auth, roles & security  (1 day)

**Goal:** real authorization. Depends on: P4.

### 7.1 🔴 `/admin` gated only by sign-in
`App.tsx:118` `ProtectedRoute` checks `isSignedIn` only; any user can load Admin.
- Add `RoleProtectedRoute` driven by `routes.config.ts` `access: 'role:admin'`.
- **Enforce on the server too** — add role checks in user-service/video-service middleware for admin/mutation routes; never trust the client.

### 7.2 🔴 `checkRole` misuses hooks
`roles.ts:5` calls `useUser()` inside a plain `async` function (rules-of-hooks violation) and is `async` for a sync value.
- Replace with `useRole(): { role, isAdmin }` reading from one source of truth.

### 7.3 🔴 Role taxonomy mismatch
Client `Roles = 'admin' | 'moderator'` (`types.ts:4`); DB `users.role` defaults `"Consumer"` and is a free `String`; Clerk `publicMetadata.role` is a third copy.
- Define one enum, reconcile DB ↔ Clerk ↔ client, and make the DB an enum/constrained set via migration.

### 7.4 🟡 Auth route typos / dead routes
`userRoutes.ts:33-34` reference `apiUrl:"/erros/sign-in"` (typo) and handlers that do nothing; `userRoutes.ts:24` has a commented-out middleware.
- Remove dead routes or implement them; fix the `erros` typo in `errorRoute`/`errorController` references.

**Acceptance:** non-admin users get redirected from `/admin` on both client and server; `useRole` has no hook violations; one role enum across the stack; no dead/typo'd routes.

---

## Phase 8 — Types, shared contracts & lint hardening  (1–1.5 days)

**Goal:** stop drift between client and services; tighten TS. Depends on: P1–P3.

### 8.1 🟡 Hand-maintained types mirror backend schemas
`client/src/types.ts` `VideoType`/`userType`/`CommentType` duplicate Prisma models and must be kept in sync manually.
- Create a shared `packages/contracts` (or generate DTOs from Prisma) consumed by client + both services. At minimum, derive client types from the API envelope.

### 8.2 🟡 Pervasive `any`
`videoApi.ts` (`args: any`), `useInfiniteFeed` (`res: any`), `useVideoInfo` (`f: any`), controllers (`err: any`), `VideoInfo` `useComments(videoState as any)`.
- Type the RTK Query endpoints (request + response generics), remove `as any`, and set eslint `@typescript-eslint/no-explicit-any` to error with targeted exceptions.

### 8.3 🟡 `userType.followers` vs `_count`
Client type declares `followers: FollowerType[]` but the API returns `_count`. Align the type with the actual payload.

### 8.4 🟡 Tooling
- Ensure both services and client share a base `tsconfig`, eslint, prettier.
- Add `no-console`, `no-explicit-any`, react-hooks rules; run in CI.

**Acceptance:** `tsc --noEmit` clean across all three packages with `strict` on; no `as any` in `src`; shared types imported, not re-declared.

---

## Phase 9 — Testing, docs & verification  (ongoing, ~2 days to seed)

**Goal:** lock in the fixes. Depends on: all.

- **Backend:** integration tests for the new/changed endpoints (`getUserVideos` pagination, `updateLikes` idempotency + count integrity, `getUserByUsername`, follow/unfollow transaction, DLQ behavior). Add a test that concurrently likes the same video and asserts `likeCount === 1`.
- **Client:** component tests for `Button`/`VideoThumbnailCard`; hook tests for `useVideoLikes`/`useVideoComments` with a mocked socket; a test asserting only one socket connection is created.
- **E2E (Playwright):** sign-in → upload → appears in Vault via `/videos/user/:id`; like reflects across two tabs (rooms); profile edit updates name across video cards.
- **Docs:** `docs/adr/0001-user-denormalization.md`, `docs/realtime-contract.md` (events + rooms), update `CLAUDE.md`/README with the route-config and token-enforcement conventions.
- **CI gates:** build, `tsc --noEmit`, eslint, the token `git grep` guard, and the test suites.

---

## Consolidated issue index (traceability)

| ID | Sev | Area | File(s) | Phase |
|----|-----|------|---------|-------|
| getUserVideos unbounded | 🟠 | video-svc | videoController.ts:116 | 1.1 |
| updateLikes refetch-all | 🟠 | video-svc | videoController.ts:429 | 1.2 |
| non-transactional counters | 🔴 | video-svc | videoController.ts:338,402 | 1.3 |
| like race | 🔴 | video-svc | videoController.ts:391 | 1.4 |
| response envelopes | 🟡 | both | *controllers | 1.5 |
| offset vs cursor | 🟠 | user-svc | userController.ts:6 | 1.6 |
| no getUserByUsername | 🟡 | user-svc | userRoutes.ts | 1.7 |
| search scan | 🟠 | video-svc | videoController.ts:35 | 1.8 |
| stale cross-service user data | 🔴 | both | video schema, userWorker.ts | 2.1 |
| no DLQ | 🔴 | user-svc | userWorker.ts:47 | 2.2 |
| io.on disconnect | 🔴 | video-svc | socketController.ts:17 | 2.3 |
| broadcast no rooms | 🟠 | video-svc | socketController.ts:11,14 | 2.4 |
| stringly events | 🟡 | both | socketController.ts, videoApi.ts, hooks | 2.5 |
| client socket lifecycle | 🔴 | client | socket.ts, useComments/useVideoInfo/useVideoRealtime | 2.6 |
| persist key collision | 🔴 | client | store.ts:14 | 3.1 |
| token in localStorage | 🔴 | client | store.ts:21, authSlice | 3.2 |
| serializableCheck | 🟡 | client | store.ts:38 | 3.3 |
| fetch-all + filter | 🟠 | client | Vault.tsx, useUserProfile.ts | 3.4 |
| overlapping video hooks | 🟡 | client | useComments/useVideoRealtime/useVideoInfo | 3.5 |
| effect deps/stale state | 🔴 | client | useVideoInfo.ts:25,113 | 3.6 |
| filteredVideo dup | 🟡 | client | FilteredVideoSlice, SearchBar | 3.7 |
| dual route registration | 🟡 | client | App.tsx, routeLoader.ts | 4.1 |
| magic-string layout | 🟡 | client | Layout.tsx, Navbar.tsx | 4.2 |
| nav divergence | 🟡 | client | Sidebar.tsx, Navbar.tsx | 4.3 |
| surface vs background | 🔵 | client | multiple pages | 4.4 |
| no Button primitive | 🟡 | client | 24 files | 5.1 |
| duplicated video card | 🟡 | client | Vault/UserVideoGrid/VideoCard | 5.2 |
| duplicated profile header | 🟡 | client | Vault.tsx | 5.3 |
| mock data in UI | 🔴 | client | UserVideoGrid.tsx:50, Vault.tsx:156,213 | 5.4 |
| white/x bypass | 🔵 | client | 8 files | 6.1 |
| legacy palette pages | 🔵 | client | Admin/ManageVideos/SignIn/SignUp/Share/NotFound/VideoCard | 6.2 |
| css hardcoded colors | 🔵 | client | index.css:171,283,287; AvatarConnectBadge.tsx:70 | 6.3 |
| unused scales | 🔵 | client | index.css | 6.4 |
| admin gate | 🔴 | client/both | App.tsx:118 | 7.1 |
| checkRole hook misuse | 🔴 | client | roles.ts:5 | 7.2 |
| role taxonomy | 🔴 | both | types.ts:4, user schema | 7.3 |
| dead/typo routes | 🟡 | user-svc | userRoutes.ts:33 | 7.4 |
| hand-maintained types | 🟡 | all | types.ts | 8.1 |
| pervasive any | 🟡 | client | videoApi.ts, hooks | 8.2 |
| dead code | 🟡 | client | DesktopNavItem, FeaturedArchivesGrid, uploaderSlice | 0.1-0.3 |
| brand name | 🔵 | client | PublicProfile.tsx:41 | 0.4 |

---

## Rollout summary

| Phase | Theme | Risk | Effort |
|-------|-------|------|--------|
| 0 | Cleanup & hygiene | low | ½ d |
| 1 | Backend data correctness & scale | med | 2–3 d |
| 2 | Cross-service consistency & realtime | high | 2 d |
| 3 | Client data/state/hooks | high | 3 d |
| 4 | Routing & nav SSOT | low | 1 d |
| 5 | Component primitives | med | 2–3 d |
| 6 | Token adoption & color | low | 1.5–2 d |
| 7 | Auth & roles | med | 1 d |
| 8 | Types & lint | med | 1–1.5 d |
| 9 | Tests, docs, CI | med | 2 d+ |

**Total:** ~16–20 dev-days. Phases 0/4/6 can be parallelized with 1/2/3 by a second contributor.
