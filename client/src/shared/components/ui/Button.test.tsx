import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "./Button";

describe("Button", () => {
  it("renders its children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("defaults to type=button (so it never accidentally submits a form)", () => {
    render(<Button>Go</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("fires onClick", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Tap</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled while loading and shows a spinner", () => {
    render(<Button loading>Saving</Button>);
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    // spinner is decorative
    expect(btn.querySelector("[aria-hidden]")).not.toBeNull();
  });

  it("applies primary variant token classes", () => {
    render(<Button variant="primary">P</Button>);
    expect(screen.getByRole("button").className).toContain("bg-primary");
  });

  it("unstyled variant applies only the caller's className", () => {
    render(<Button variant="unstyled" className="custom-only">U</Button>);
    const cls = screen.getByRole("button").className;
    expect(cls).toContain("custom-only");
    expect(cls).not.toContain("bg-primary");
  });

  it("pill variant reflects active state", () => {
    const { rerender } = render(<Button variant="pill" active>Tab</Button>);
    expect(screen.getByRole("button").className).toContain("pill-active");
    rerender(<Button variant="pill">Tab</Button>);
    expect(screen.getByRole("button").className).toContain("pill-inactive");
  });
});
