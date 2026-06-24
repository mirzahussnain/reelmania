import { describe, it, expect, vi } from "vitest";
import type { Response } from "express";
import { ok, fail } from "./http";

const mockRes = () => {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe("http envelope helpers", () => {
  it("ok() wraps data in the success envelope", () => {
    const res = mockRes();
    ok(res, { id: "v1" }, undefined, "Found");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Found",
      data: { id: "v1" },
    });
  });

  it("ok() includes meta only when provided", () => {
    const res = mockRes();
    ok(res, [1, 2], { nextCursor: "abc", limit: 2 });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "OK",
      data: [1, 2],
      meta: { nextCursor: "abc", limit: 2 },
    });
  });

  it("ok() honours a custom status", () => {
    const res = mockRes();
    ok(res, null, undefined, "Created", 201);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("fail() always returns data:null and the message", () => {
    const res = mockRes();
    fail(res, 404, "Not found");
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Not found",
      data: null,
    });
  });

  it("fail() serialises an Error into the error field", () => {
    const res = mockRes();
    fail(res, 500, "Boom", new Error("kaboom"));
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Boom",
      data: null,
      error: "kaboom",
    });
  });
});
