import { describe, expect, it } from "vitest";
import type { Layout } from "@appsense/core";
import { isPlanId, newPlanId } from "./plans/store.js";
import { readableLayout } from "./tools/format.js";

describe("plan ids", () => {
  it("are timestamped slugs safe for file names and URLs", () => {
    const id = newPlanId("Work & Focus: v2!", new Date("2026-10-01T12:34:56Z"));
    expect(id).toBe("20261001123456-work-focus-v2");
    expect(isPlanId(id)).toBe(true);
    expect(isPlanId("../etc/passwd")).toBe(false);
  });
});

describe("readableLayout", () => {
  it("summarizes dock, folders, widgets, and slot usage", () => {
    const layout: Layout = {
      dock: [{ kind: "app", id: "a", name: "Safari" }],
      pages: [
        [
          { kind: "widget", id: "w1", name: "Weather widget", size: "small" },
          { kind: "folder", name: "Tools", pages: [[{ kind: "app", id: "b", name: "Calculator" }]] },
        ],
      ],
    };
    expect(readableLayout(layout)).toBe(
      'Dock: Safari\nPage 1 (5/24 slots): <Weather widget, small, id=w1>, [Folder "Tools": Calculator]',
    );
  });
});
