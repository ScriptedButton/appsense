import { describe, expect, it } from "vitest";
import { catalog, rawIconState } from "./fixtures.js";
import { buildGuide, guideToMarkdown } from "./guide.js";
import { diffLayouts } from "./diff.js";
import { layoutToSpec, locateIcons } from "./layout.js";
import { normalizeIconState } from "./normalize.js";
import { toIconState } from "./iconState.js";
import { validateSpec } from "./validate.js";
import type { LayoutSpec } from "./schema.js";

const current = normalizeIconState(rawIconState);
const nameOf = (id: string) => catalog[id]?.name ?? id;

describe("normalizeIconState", () => {
  it("splits dock and pages and recognizes item kinds", () => {
    expect(current.dock.map((item) => item.kind === "app" && item.id)).toEqual([
      "com.apple.mobilesafari",
      "com.apple.mobilephone",
      "com.apple.MobileSMS",
    ]);
    expect(current.pages).toHaveLength(2);
    const [widget, , , , folder] = current.pages[0]!;
    expect(widget).toMatchObject({ kind: "widget", id: "W-1", size: "small", name: "Weather widget" });
    expect(folder).toMatchObject({ kind: "folder", name: "Utilities" });
    expect(folder?.kind === "folder" && folder.pages).toHaveLength(1);
    expect(current.pages[1]![2]).toMatchObject({ kind: "webclip", id: "CLIP-1", url: "https://example.com" });
  });

  it("converts back to SpringBoard icon state losslessly", () => {
    const raw = toIconState(current, rawIconState);
    expect(normalizeIconState(raw)).toEqual(current);
    expect((raw[1] as Record<string, unknown>[])[0]).toBe(rawIconState[1]![0]);
  });

  it("round-trips through the compact spec", () => {
    const result = validateSpec(layoutToSpec(current), { current, catalog });
    expect(result.errors).toEqual([]);
    expect(result.layout).toEqual(current);
  });
});

describe("validateSpec", () => {
  it("reports unplaced apps, duplicates, and unknown ids with suggestions", () => {
    const spec: LayoutSpec = {
      dock: ["com.apple.mobilesafari", "com.apple.mobilesafari"],
      pages: [["Spotify"]],
    };
    const { ok, errors } = validateSpec(spec, { current, catalog });
    expect(ok).toBe(false);
    const codes = errors.map((error) => error.code);
    expect(codes).toContain("duplicate");
    expect(codes).toContain("unknown_id");
    expect(codes).toContain("unplaced_apps");
    expect(errors.find((error) => error.code === "unknown_id")?.message).toContain("com.spotify.client");
  });

  it("enforces dock, page and folder limits", () => {
    const spec: LayoutSpec = {
      dock: [
        "com.apple.mobilesafari",
        "com.apple.mobilephone",
        "com.apple.MobileSMS",
        "com.apple.weather",
        "com.spotify.client",
      ],
      pages: [[{ folder: "Solo", apps: ["com.netflix.Netflix"] }]],
    };
    const codes = validateSpec(spec, { current, catalog, sendUnlistedToAppLibrary: true }).errors.map((e) => e.code);
    expect(codes).toContain("dock_full");
    expect(codes).toContain("folder_too_small");
  });

  it("counts widget footprints toward page capacity", () => {
    const filler = Array.from({ length: 21 }, () => "x");
    const spec: LayoutSpec = { dock: [], pages: [[{ widget: "W-1" }, ...filler]] };
    const codes = validateSpec(spec, { current, catalog, sendUnlistedToAppLibrary: true }).errors.map((e) => e.code);
    expect(codes).toContain("page_full");
  });

  it("sends unlisted apps to the App Library when asked", () => {
    const spec: LayoutSpec = { dock: ["com.apple.mobilesafari"], pages: [["com.spotify.client"]] };
    const result = validateSpec(spec, { current, catalog, sendUnlistedToAppLibrary: true });
    expect(result.ok).toBe(true);
    expect(result.appLibrary).toContain("com.burbn.instagram");
    expect(result.warnings.map((w) => w.code)).toEqual(expect.arrayContaining(["sent_to_app_library", "widget_removed"]));
  });
});

describe("diff and guide", () => {
  const spec: LayoutSpec = {
    dock: ["com.apple.mobilephone", "com.apple.MobileSMS", "com.apple.mobilesafari", "com.spotify.client"],
    pages: [
      [
        { widget: "W-1" },
        { folder: "Tools", apps: ["com.apple.calculator", "com.apple.compass", "com.apple.weather"] },
        { folder: "Social", apps: ["com.burbn.instagram", "com.toyopagroup.picaboo"] },
        "com.duolingo.DuolingoMobile",
        "CLIP-1",
      ],
    ],
    appLibrary: ["com.netflix.Netflix"],
  };
  const result = validateSpec(spec, { current, catalog });
  const diff = diffLayouts(current, result.layout, result.appLibrary);

  it("validates the proposal", () => {
    expect(result.errors).toEqual([]);
  });

  it("matches renamed folders and classifies changes", () => {
    expect(diff.folders).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "rename", from: "Utilities", name: "Tools" }),
        expect.objectContaining({ kind: "create", name: "Social" }),
      ]),
    );
    expect(diff.toAppLibrary).toEqual(["com.netflix.Netflix"]);
    expect(diff.fromAppLibrary.map((entry) => entry.id)).toEqual(["com.duolingo.DuolingoMobile"]);
    expect(diff.summary.pagesBefore).toBe(2);
    expect(diff.summary.pagesAfter).toBe(1);
    expect(diff.moves.find((move) => move.id === "com.apple.calculator")).toBeUndefined();
    expect(diff.moves.map((move) => move.id)).toContain("com.apple.weather");
  });

  it("produces an ordered, readable guide", () => {
    const steps = buildGuide(current, result.layout, diff, nameOf);
    const sections = steps.map((step) => step.section);
    expect(sections[0]).toBe("prepare");
    expect(sections.indexOf("remove")).toBeLessThan(sections.indexOf("folders"));
    expect(sections.indexOf("folders")).toBeLessThan(sections.indexOf("pages"));
    expect(new Set(steps.map((step) => step.id)).size).toBe(steps.length);
    const markdown = guideToMarkdown(steps);
    expect(markdown).toContain('Rename "Utilities" to "Tools"');
    expect(markdown).toContain('Create the "Social" folder');
    expect(markdown).toContain("Duolingo (from App Library)");
    expect(markdown).toContain("Remove leftover pages");
  });

  it("locates icons inside folders", () => {
    expect(locateIcons(result.layout).get("com.apple.compass")).toEqual({ area: "page", page: 0, folder: "Tools", index: 1 });
  });
});
