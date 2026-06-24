# ReelMania 🎬

> A full-stack, production-grade short-form video streaming platform — built with a microservices architecture, real-time WebSocket events, cloud-native infrastructure, and Kubernetes orchestration on Microsoft Azure.

---

## 📸 Overview

ReelMania is a TikTok-inspired video platform where users can upload, stream, like, comment on, and share short-form videos. It is designed as a **decoupled microservices system** with independent deployable services, containerised with Docker, orchestrated via Kubernetes, and hosted on Azure App Services.

---

## 🎨 UI/UX Architecture Redesign (`feature/ui-redesign`)

This branch introduces a massive overhaul of the frontend component architecture, specifically targeting the video player UI, reducing technical debt, and implementing strict modern Glassmorphism aesthetics:

- **Component Decoupling**: Massive React components (like `VideoInfo.tsx` and `UploadVideo.tsx`) were refactored from 500+ lines down to ~150 lines. Business logic (data fetching, intersection observers, state management) was decoupled into isolated custom hooks (e.g., `useVideoInfo`, `useVideoUpload`, `useComments`).
- **Global Tailwind Utilities**: Introduced `cn()` utility via `clsx` and `tailwind-merge` to clean up heavily repeated Tailwind patterns and allow dynamic class injection without style conflicts.
- **Glassmorphism Theme**: Standardized the UI with a premium dark-mode Glassmorphism aesthetic, utilizing `backdrop-blur`, semi-transparent `bg-surface-container` overlays, and smooth micro-animations.
- **TikTok-Style Overlay**: Completely redesigned the `PlayerCard`, `VideoActions`, and `VideoInfoOverlay` to match modern short-form UX:
  - Responsive `100dvh` layout tracking to fix mobile address bar clipping.
  - Transparent video captions with clean drop-shadow text.
  - Expandable `line-clamp-1` captions with smooth `more/less` toggles.
  - Animated, floating action buttons pinned perfectly to the `aspect-[9/16]` video edge.

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                        Client (Nginx + React)                      │
│           React · TypeScript · Redux Toolkit · Tailwind            │
└───────────────────────────┬────────────────────────────────────────┘
                            │ HTTP / WebSocket
          ┌─────────────────┴──────────────────┐
          │                                    │
┌─────────▼──────────┐              ┌──────────▼──────────┐
│   User Service     │              │   Video Service     │
│  Node.js · Express │              │  Node.js · Express  │
│  TypeScript · Clerk│              │  TypeScript · Clerk │
│  Prisma ORM        │              │  Prisma ORM         │
└─────────┬──────────┘              └──────────┬──────────┘
          │                                    │
┌─────────▼──────────┐              ┌──────────▼──────────┐
│ RabbitMQ (Webhooks)│              │ Redis (Caching)     │
└─────────┬──────────┘              └──────────┬──────────┘
          │                                    │
┌─────────▼──────────┐              ┌──────────▼──────────┐
│  CockroachDB       │              │  Azure CosmosDB     │
│  (PostgreSQL)      │              │  (MongoDB API)      │
└────────────────────┘              └──────────┬──────────┘
                                               │
                                    ┌──────────▼──────────┐
                                    │  Azure Blob Storage │
                                    │  (Video Files)      │
                                    └─────────────────────┘

Infrastructure: Docker · Kubernetes (AKS) · Azure App Services
Message Broker: RabbitMQ (Webhook processing & rate limiting)
Caching:        Redis (Global feed cache & O(1) reads)
Auth:           Clerk (JWT + Webhooks)
Real-time:      Socket.IO (WebSockets)
```

---

## ✨ Features

### User-Facing
- 🎥 **Infinite scroll video feed** — snap-scroll with auto-play on viewport entry (IntersectionObserver + GSAP)
- ❤️ **Real-time likes** — optimistic UI updates, live sync across all connected clients via Socket.IO
- 💬 **Real-time comments** — comments broadcast instantly to all viewers of the same video
- 🔍 **Search & Explore** — filter videos by hashtag or title with a dedicated Explore page
- 👤 **User profiles** — follower counts, uploaded videos, follow/unfollow with live state
- 📤 **Video upload** — file validation, 40-second preview cache, Azure Blob Storage upload with progress feedback
- 🔗 **Share** — share links via WhatsApp, Twitter, Email, or clipboard copy

### Technical
- 🚀 **High-Performance Caching** — Redis caches the global trending feed, providing near 0ms load times and combining with Fisher-Yates shuffle algorithms for unique guest experiences.
- 🐇 **Enterprise Message Queues** — RabbitMQ decouples Clerk Webhooks from the PostgreSQL database, protecting the User Service from massive traffic spikes via asynchronous consumer workers.
- 🔐 **Clerk authentication** — JWT-secured API routes, Svix webhook sync for user lifecycle events
- 🏗️ **Microservices** — independently deployable User Service and Video Service with strict DRY separation of concerns.
- 🌐 **Kubernetes** — Deployment manifests, ConfigMaps, Secrets, and Ingress rules for full cluster orchestration
- 🐳 **Dockerised** — multi-stage Docker builds for all three services (client, user-service, video-service)
- 📊 **Grafana Monitoring** — infrastructure observability integrated via Azure monitoring stack
- 🎭 **RBAC** — role-based access control (Consumer / Creator / Admin) with Clerk metadata
- ♻️ **Redux Persist** — client-side state persistence across sessions

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, GSAP |
| **State Management** | Redux Toolkit, RTK Query, Redux Persist |
| **Auth** | Clerk (JWT, Webhooks via Svix) |
| **Backend** | Node.js, Express.js, TypeScript |
| **ORM** | Prisma |
| **Databases** | CockroachDB (Users), Azure CosmosDB / MongoDB API (Videos) |
| **Message Broker** | RabbitMQ |
| **Caching** | Redis |
| **File Storage** | Azure Blob Storage |
| **Real-time** | Socket.IO (WebSockets) |
| **Containerisation** | Docker (multi-stage builds) |
| **Orchestration** | Kubernetes (AKS) |
| **Hosting** | Microsoft Azure App Services |
| **Monitoring** | Grafana |
| **Reverse Proxy** | Nginx |

---

## 📁 Project Structure

```
reelmania/
├── client/                     # React frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components (PlayerCard, Comments, Navbar…)
│   │   ├── pages/              # Route-level page components
│   │   └── utils/
│   │       ├── store/          # Redux store, slices, RTK Query API definitions
│   │       ├── hooks/          # Custom hooks (useScreenWidth, storeHooks)
│   │       └── functions/      # Helpers (formatter, socket, routeLoader, roles)
│   ├── Dockerfile
│   └── nginx.conf
│
├── backend/
│   ├── user-service/           # User management microservice (port 8000)
│   │   ├── src/
│   │   │   ├── controllers/    # userController, hookController (Clerk webhooks), errorController
│   │   │   ├── middlewares/    # Clerk authMiddleware
│   │   │   ├── routes/         # userRoutes, webhookRoutes, errorRoute
│   │   │   └── utils/          # Shared types
│   │   ├── prisma/             # CockroachDB schema + migrations
│   │   └── Dockerfile
│   │
│   └── video-service/          # Video streaming microservice (port 8001)
│       ├── src/
│       │   ├── controllers/    # videoController, socketController
│       │   ├── middelwares/    # Clerk authMiddleware, Socket.IO setup
│       │   ├── routes/         # videoRoutes (multer file uploads)
│       │   └── utils/          # Azure Blob config, Prisma client, Socket server
│       ├── prisma/             # MongoDB schema (CosmosDB)
│       └── Dockerfile
│
├── k8s/                        # Kubernetes manifests
│   ├── config/                 # ConfigMap + Secrets
│   ├── services/               # Deployments + Services for each microservice
│   └── ingress.yaml
│
└── docker-compose.yaml         # Local full-stack orchestration
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18
- Docker + Docker Compose
- A [Clerk](https://clerk.com) account
- A Microsoft Azure account (Blob Storage + CosmosDB)
- A CockroachDB cloud cluster

### 1. Clone the repository

```bash
git clone https://github.com/mirzahussnain/reelmania.git
cd reelmania
```

### 2. Configure environment variables

Create `.env` files for each service. Reference the tables below.

**Root `.env`** (used by Docker Compose):

```env
# Clerk
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
WEBHOOK_SIGNING_SECRET=whsec_...

# Databases
USER_DATABASE_URL=postgresql://...
VIDEO_DATABASE_URL=mongodb+srv://...

# Azure Blob Storage
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;...
AZURE_STORAGE_ACCOUNT_NAME=...
AZURE_BLOB_CONTAINER_NAME=videos
AZURE_ACCOUNT_URL=https://...

# Service URLs
FRONTEND_URL=http://localhost:80
VITE_USER_SERVICE_URL=http://localhost:8000
VITE_VIDEO_SERVICE_URL=http://localhost:8001
VITE_SOCKET_URL=http://localhost:8001
VITE_VIDEO_SHARE_BASE_URL=http://localhost:80

# Ports
USER_SERVICE_PORT=8000
VIDEO_SERVICE_PORT=8001
SOCKET_PATH=/videosocket/
```

### 3. Run with Docker Compose (recommended)

```bash
docker-compose up --build
```

This starts:
- **Client** on `http://localhost:80`
- **User Service** on `http://localhost:8000`
- **Video Service** on `http://localhost:8001`

### 4. Run services individually (development)

```bash
# User Service
cd backend/user-service
npm install
npx prisma migrate deploy
npm run dev

# Video Service
cd backend/video-service
npm install
npx prisma generate
npm run dev

# Client
cd client
npm install
npm run dev
```

---

## 🔌 API Reference

> **Response envelope.** Every endpoint in both services returns one shape:
> `{ success, message, data, meta? }`. The payload is always under `data`
> (`null` on error/no-content); list endpoints carry pagination in `meta`
> (`nextCursor` / `page` / `limit` / `total`). Helpers `ok()` / `fail()` in each
> service's `src/utils/http.ts` are the only way responses are written, so the
> shape can't drift. Client request/response types are derived from this
> envelope in `client/src/shared/contracts/api.ts`.

### User Service — `http://localhost:8000/api/users`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | Public | Get all users |
| `GET` | `/profile/:userId` | Public | Get a user's public profile |
| `GET` | `/:userId/myprofile` | 🔒 Required | Get authenticated user's profile |
| `PUT` | `/:userId/myprofile` | 🔒 Required | Update authenticated user's profile |
| `DELETE` | `/:userId/myprofile` | 🔒 Required | Delete authenticated user's account |
| `PUT` | `/:userId/follow` | 🔒 Required | Toggle follow/unfollow a user |
| `GET` | `/:userId/followers` | Public | Get a user's followers |
| `PUT` | `/:username/role` | 🔒 Required | Update a user's role (Admin only) |

**Webhooks** — `http://localhost:8000/api/webhook/user`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/manage` | Clerk webhook handler (user.created / user.updated / user.deleted) |

---

### Video Service — `http://localhost:8001/api/videos`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | Public | Get all videos (shuffled) |
| `GET` | `/:videoId` | Public | Get a video by ID |
| `GET` | `/user/:userId` | Public | Get all videos by a specific user |
| `GET` | `/:videoId/likes` | Public | Get likes for a video |
| `GET` | `/:videoId/comments` | Public | Get comments for a video |
| `POST` | `/video` | 🔒 Required | Upload a new video (multipart/form-data) |
| `POST` | `/:videoId/comments` | 🔒 Required | Add a comment to a video |
| `PUT` | `/:videoId/likes` | 🔒 Required | Toggle like on a video |
| `DELETE` | `/:videoId` | 🔒 Required | Delete a video |

---

## 🌐 WebSocket Events

The Video Service exposes a Socket.IO server at `/videosocket/`. Clients hold a
**single** connection (owned by `SocketProvider`) and events are scoped to a
**per-video room** (`videoId`) — a client only receives events for videos it is
viewing. Event names live in one constants module per side and must stay in
sync.

| Event (emit) | Payload | Description |
|---|---|---|
| `joinVideo` / `leaveVideo` | `videoId` | Join / leave a video's room |
| `newComment` | `{ videoId, newComment, commentCount }` | Notify a new comment |
| `likeUpdated` | `{ videoId, updatedLikes }` | Notify updated likes |

| Event (listen) | Payload | Description |
|---|---|---|
| `newCommentAdded` | `{ videoId, newComment, commentCount? }` | A new comment in the room |
| `likesChange` | `{ videoId, updatedLikes }` | Likes changed in the room |

📄 Full contract: [`docs/realtime-contract.md`](docs/realtime-contract.md).

---

## 🧪 Testing, Quality Gates & CI

Conventions enforced across the stack (see [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md)):

- **Routing SSOT** — routes, layout, guards and nav are generated from
  `client/src/app/routes.config.ts`; adding a route means editing only that file.
- **Design tokens** — no raw hex / `rgba()` / `-white/` / palette classes in
  `client/src/**`; the `npm run lint:tokens` guard fails the build otherwise.
- **Types** — `tsc --noEmit` is clean across all three packages with `strict`
  on; `@typescript-eslint/no-explicit-any` and `no-console` are eslint errors in
  the client.
- **Observability** — both services log structured JSON via a shared `pino`
  logger; `pino-http` adds a per-request id.

**Tests** (Vitest; backend deps are mocked, so no datastore is required):

```bash
# client (component + hook + socket tests)
cd client && npm test
# services
cd backend/user-service && npm test
cd backend/video-service && npm test
# e2e scaffold (flows deferred — needs the full stack)
cd client && npm run test:e2e
```

**CI** — [`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on PRs and
pushes to `main`: client (lint, token guard, typecheck, build, tests) and a
matrix over both services (prisma generate, typecheck, tests).

---

## ☸️ Kubernetes Deployment

Kubernetes manifests are in the `k8s/` directory.

```bash
# Apply configuration
kubectl apply -f k8s/config/configmap.yaml
kubectl apply -f k8s/config/secrets.yaml

# Deploy services
kubectl apply -f k8s/services/user-service.yaml
kubectl apply -f k8s/services/video-service.yaml
kubectl apply -f k8s/services/client.yaml

# Apply Ingress
kubectl apply -f k8s/ingress.yaml
```

Each service runs with **2 replicas** by default, with health checks configured via `HEALTHCHECK` in each Dockerfile and `npm run healthcheck` scripts.

---

## 🗄️ Database Schemas

### User Service — CockroachDB (PostgreSQL via Prisma)

```prisma
model users {
  id          String      @id
  first_name  String
  last_name   String
  email       String      @unique
  username    String      @unique
  avatar_url  String
  role        String      @default("Consumer")
  created_at  DateTime    @default(now())
  followers   followers[] @relation("followers_following_idTousers")
  following   followers[] @relation("followers_follower_idTousers")
}

model followers {
  follower_id   String
  following_id  String
  created_at    DateTime @default(now())
  @@id([follower_id, following_id])
}
```

### Video Service — MongoDB (Azure CosmosDB)

```ts
model videos {
  id          String           // MongoDB ObjectId
  title       String
  video_url   String           // Azure Blob Storage URL
  hashtags    String[]
  uploaded_at DateTime
  uploaded_by Uploader         // { id, username }
  Likes       VideosLikes[]    // [{ liked_by: { id, username } }]
  comments    VideosComments[] // [{ author, posted_at, text }]
}
```

---

## 🔒 Authentication & Authorisation

Authentication is handled by **Clerk**:

- JWTs are issued by Clerk and verified on each protected route via `@clerk/express` middleware
- User lifecycle events (creation, update, deletion) are synced to the User Service database via Clerk **Svix webhooks**, verified with a signing secret
- Role-based access is stored in Clerk's `publicMetadata` and enforced on both client and server
- Three roles are supported: `Consumer` (default), `Creator`, and `Admin`

---

## 📦 Docker Images

Each service has a **multi-stage Dockerfile** for lean production images:

```bash
# Build and tag individually
docker build -t reelmania-client ./client
docker build -t reelmania-user-service ./backend/user-service
docker build -t reelmania-video-service ./backend/video-service

# Or use Docker Compose
docker-compose up --build
```

---

## 🧪 Known Issues & Future Improvements

- [ ] Add unit and integration test suites (Jest / Vitest / Supertest)
- [ ] Add Grafana dashboard configuration files to the repository
- [ ] Implement video transcoding pipeline (e.g. FFmpeg on upload) for adaptive bitrate streaming
- [ ] Add pagination to video and comment feeds
- [ ] Extract video thumbnail generation server-side rather than client-side canvas
- [ ] Rate limiting on public API endpoints
- [ ] CI/CD pipeline (GitHub Actions) for automated build, test, and deploy on push

---

## 👨‍💻 Author

**Hussnain Ali** — Full-Stack Software Engineer  
[hussnainali.me](https://hussnainali.me) · [GitHub](https://github.com/mirzahussnain) · [LinkedIn](https://linkedin.com/in/hussnain-ali-dev)

---

## 📄 Licence

This project is for portfolio and demonstration purposes.
