import { describeLocation, folderIcons, locateIcons, pageSlots } from "@appsense/core";
import type { Catalog, DiffSummary, Issue, Layout, PageItem } from "@appsense/core";

function describeItem(item: PageItem): string {
  if (item.kind === "folder") {
    return `[Folder "${item.name}": ${folderIcons(item).map((icon) => icon.name).join(", ")}]`;
  }
  if (item.kind === "widget") return `<${item.name}, ${item.size}, id=${item.id}>`;
  return item.kind === "webclip" ? `${item.name} (web clip)` : item.name;
}

/** Human-readable rendering of a layout so the agent can reason about it quickly. */
export function readableLayout(layout: Layout): string {
  const lines = [`Dock: ${layout.dock.map(describeItem).join(", ") || "(empty)"}`];
  layout.pages.forEach((page, index) => {
    lines.push(`Page ${index + 1} (${pageSlots(page)}/24 slots): ${page.map(describeItem).join(", ")}`);
  });
  return lines.join("\n");
}

export function appTable(layout: Layout, catalog: Catalog, options: { onlyHomeScreen?: boolean } = {}): string {
  const locations = locateIcons(layout);
  const entries = Object.values(catalog)
    .filter((entry) => !options.onlyHomeScreen || locations.has(entry.id))
    .sort((a, b) => (a.genre ?? "~").localeCompare(b.genre ?? "~") || a.name.localeCompare(b.name));

  const byGenre = new Map<string, string[]>();
  for (const entry of entries) {
    const genre = entry.genre ?? "Unknown";
    const flags = [entry.kind === "webclip" ? "web clip" : "", entry.system ? "system" : ""].filter(Boolean).join(", ");
    const row = `- ${entry.name} | ${entry.id} | ${describeLocation(locations.get(entry.id))}${flags ? ` | ${flags}` : ""}`;
    byGenre.set(genre, [...(byGenre.get(genre) ?? []), row]);
  }
  const sections = [...byGenre].map(([genre, rows]) => `## ${genre} (${rows.length})\n${rows.join("\n")}`);
  return [`Format: name | bundle id | current location | flags`, ...sections].join("\n\n");
}

export function formatSummary(summary: DiffSummary): string {
  return [
    `Pages: ${summary.pagesBefore} -> ${summary.pagesAfter}`,
    `Moved: ${summary.moved}, reordered: ${summary.reordered}, unchanged: ${summary.unchanged}`,
    `To App Library: ${summary.toAppLibrary}, added from App Library: ${summary.fromAppLibrary}`,
    `Folders created: ${summary.foldersCreated}, renamed: ${summary.foldersRenamed}, removed: ${summary.foldersRemoved}`,
    `Widgets moved: ${summary.widgetsMoved}, removed: ${summary.widgetsRemoved}`,
  ].join("\n");
}

export function formatIssues(title: string, issues: Issue[]): string {
  if (issues.length === 0) return "";
  return `${title}:\n${issues.map((issue) => `- [${issue.code}] ${issue.message}`).join("\n")}`;
}
