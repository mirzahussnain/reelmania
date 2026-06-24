import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

// ── Mocks: a fake shared socket, the RTK Query endpoints, and identity ──
const { fakeSocket, joinVideo, leaveVideo, getLikesTrigger, updateLikesTrigger } = vi.hoisted(() => ({
  fakeSocket: { on: vi.fn(), off: vi.fn(), emit: vi.fn(), disconnect: vi.fn() },
  joinVideo: vi.fn(),
  leaveVideo: vi.fn(),
  getLikesTrigger: vi.fn(),
  updateLikesTrigger: vi.fn(),
}));

vi.mock("../providers/SocketProvider", () => ({
  useSocket: () => ({ socket: fakeSocket, joinVideo, leaveVideo }),
}));
vi.mock("../../utils/store/features/video/videoApi", () => ({
  useLazyGetLikesByVideoIdQuery: () => [getLikesTrigger],
  useUpdateLikesMutation: () => [updateLikesTrigger],
}));
vi.mock("./useCurrentUser", () => ({
  useCurrentUser: () => ({ user: { id: "u1", username: "alice" }, token: "t", isSignedIn: true }),
}));

import { useVideoLikes } from "./useVideoLikes";
import { SOCKET_EVENTS } from "../constants/socketEvents";

beforeEach(() => {
  vi.clearAllMocks();
  getLikesTrigger.mockReturnValue({
    unwrap: () => Promise.resolve({ success: true, message: "ok", data: [{ liked_by: { id: "u1", username: "alice" } }] }),
  });
});

describe("useVideoLikes realtime lifecycle", () => {
  it("joins the room and subscribes to LIKES_CHANGED, loading initial likes", async () => {
    const { result } = renderHook(() => useVideoLikes("v1"));

    expect(joinVideo).toHaveBeenCalledWith("v1");
    expect(fakeSocket.on).toHaveBeenCalledWith(SOCKET_EVENTS.LIKES_CHANGED, expect.any(Function));
    await waitFor(() => expect(result.current.likes).toHaveLength(1));
  });

  it("on unmount unsubscribes + leaves the room but NEVER disconnects the shared socket", () => {
    const { unmount } = renderHook(() => useVideoLikes("v1"));
    unmount();

    expect(fakeSocket.off).toHaveBeenCalledWith(SOCKET_EVENTS.LIKES_CHANGED, expect.any(Function));
    expect(leaveVideo).toHaveBeenCalledWith("v1");
    // The whole point of the SocketProvider refactor: hooks must not tear down
    // the connection the rest of the app shares.
    expect(fakeSocket.disconnect).not.toHaveBeenCalled();
  });

  it("does nothing when no videoId is provided", () => {
    renderHook(() => useVideoLikes(undefined));
    expect(joinVideo).not.toHaveBeenCalled();
    expect(getLikesTrigger).not.toHaveBeenCalled();
  });
});
