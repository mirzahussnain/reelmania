# Realtime contract (Socket.IO)

> Source of truth for the live comment/like events. The event names live in a
> single constants module on each side and **must be kept in sync**:
> `client/src/shared/constants/socketEvents.ts` ↔
> `backend/video-service/src/constants/socketEvents.ts`.
> No event-name string literals should appear anywhere else (IMPLEMENTATION_PLAN 2.5).

## Connection

- One connection per client, owned by `SocketProvider` (`useSocket()`); it
  connects once a session token exists and disconnects on sign-out. **Hooks must
  never connect or disconnect** — they only subscribe to events and join/leave
  rooms. (`useVideoLikes`/`useComments` enforce this; there is a unit test
  asserting the socket is created exactly once and that hook unmount never calls
  `disconnect()`.)
- Server path: `/videosocket/`. Auth token is passed in the handshake `auth`.

## Rooms

Events are scoped to a **per-video room** (the room name is the `videoId`) so a
client only receives events for videos it is currently viewing — not a global
broadcast.

- Client → server `joinVideo(videoId)` / `leaveVideo(videoId)` on mount/unmount.
- Server emits with `socket.to(videoId).emit(...)` (sender excluded).

## Events

| Constant         | Wire name         | Direction       | Payload |
|------------------|-------------------|-----------------|---------|
| `JOIN_VIDEO`     | `joinVideo`       | client → server | `videoId: string` |
| `LEAVE_VIDEO`    | `leaveVideo`      | client → server | `videoId: string` |
| `NEW_COMMENT`    | `newComment`      | client → server | `{ videoId, newComment, commentCount }` |
| `LIKE_UPDATED`   | `likeUpdated`     | client → server | `{ videoId, updatedLikes }` |
| `COMMENT_ADDED`  | `newCommentAdded` | server → clients in room | `CommentAddedPayload` |
| `LIKES_CHANGED`  | `likesChange`     | server → clients in room | `LikesChangedPayload` |

Payload types (`CommentAddedPayload`, `LikesChangedPayload`) are defined in the
client `socketEvents.ts`:

```ts
interface CommentAddedPayload { videoId: string; newComment: CommentType; commentCount?: number }
interface LikesChangedPayload { videoId: string; updatedLikes: VideoLikes[] }
```

## Flow

1. A mutation (`addNewComment` / `updateLikes`) succeeds over HTTP and returns
   the unified envelope `{ success, message, data }`.
2. In RTK Query's `onQueryStarted`, the client emits the client→server event
   built from `data` (e.g. `data.comment`, `data.updatedLikes`).
3. The server re-broadcasts the corresponding server→client event to the room.
4. Other viewers' `useVideoLikes` / `useComments` listeners update local state;
   the originating client already updated optimistically.
