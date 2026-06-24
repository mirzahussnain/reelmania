import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock socket.io-client's io() so no real network happens and we can count
// how many underlying sockets get created.
const { ioMock, fakeSocket } = vi.hoisted(() => {
  const fakeSocket = { connect: vi.fn(), disconnect: vi.fn(), connected: false };
  return { ioMock: vi.fn(() => fakeSocket), fakeSocket };
});
vi.mock("socket.io-client", () => ({ io: ioMock, Socket: class {} }));

import { connectSocket, disconnectSocket } from "./socket";

beforeEach(() => {
  ioMock.mockClear();
  fakeSocket.connect.mockClear();
  fakeSocket.disconnect.mockClear();
});

describe("socket singleton", () => {
  it("creates exactly one underlying socket no matter how many callers connect", () => {
    const a = connectSocket("token-1");
    const b = connectSocket("token-2");
    const c = connectSocket("token-3");

    // Same instance handed to every caller …
    expect(a).toBe(b);
    expect(b).toBe(c);
    // … and io() only ever invoked once (the singleton guard).
    expect(ioMock).toHaveBeenCalledTimes(1);
  });

  it("disconnectSocket tears down that single instance", () => {
    connectSocket("token");
    disconnectSocket();
    expect(fakeSocket.disconnect).toHaveBeenCalledTimes(1);
  });
});
