import { describeLocation, folderIcons, locateIcons, widgetsOf } from "./layout.js";
import type { Location } from "./layout.js";
import type { LayoutDiff } from "./diff.js";
import type { Layout, PageItem } from "./schema.js";

export type GuideSection = "prepare" | "remove" | "folders" | "dock" | "pages" | "cleanup";

export interface GuideItem {
  id: string;
  name: string;
  note?: string;
}

export interface GuideStep {
  id: string;
  section: GuideSection;
  title: string;
  detail?: string;
  items?: GuideItem[];
}

export const SECTION_TITLES: Record<GuideSection, string> = {
  prepare: "Get ready",
  remove: "Clear out",
  folders: "Folders",
  dock: "Dock",
  pages: "Arrange pages",
  cleanup: "Finish up",
};

const REMOVE_CHUNK = 12;

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

function sourceKey(location: Location): string {
  return location.area === "dock" ? "Dock" : `Page ${(location.page ?? 0) + 1}`;
}

function pageIconIds(page: PageItem[]): string[] {
  return page.flatMap((item) =>
    item.kind === "folder" ? folderIcons(item).map((icon) => icon.id) : item.kind === "widget" ? [] : [item.id],
  );
}

/** Orders the diff into manual steps a person can follow on their phone. */
export function buildGuide(
  current: Layout,
  proposed: Layout,
  diff: LayoutDiff,
  nameOf: (id: string) => string,
): GuideStep[] {
  const steps: GuideStep[] = [];
  const add = (step: Omit<GuideStep, "id">) =>
    steps.push({ ...step, id: `${step.section}-${steps.filter((s) => s.section === step.section).length + 1}` });

  const before = locateIcons(current);
  const changed = new Set(diff.changedIds);
  const libraryBound = new Set(diff.toAppLibrary);
  const keptWidgets = widgetsOf(proposed);

  add({
    section: "prepare",
    title: "Enter edit mode",
    detail:
      "Long-press an empty spot on the home screen until the icons jiggle. Tip: start dragging one app, then tap other apps with a second finger to carry several at once.",
  });

  const hiddenPages = current.pages
    .map((page, index) => ({ page, index }))
    .filter(({ page }) => {
      const icons = pageIconIds(page);
      const keepsWidget = page.some((item) => item.kind === "widget" && keptWidgets.has(item.id));
      return icons.length > 0 && !keepsWidget && icons.every((id) => libraryBound.has(id));
    });
  const hiddenPageIndexes = new Set(hiddenPages.map(({ index }) => index));
  if (hiddenPages.length > 0) {
    add({
      section: "remove",
      title: `Hide ${hiddenPages.length === 1 ? "page" : "pages"} ${hiddenPages.map(({ index }) => index + 1).join(", ")}`,
      detail:
        "Everything on these pages goes to the App Library. In edit mode, tap the page dots above the dock, then uncheck these pages and tap Done.",
    });
  }

  const removalsBySource = new Map<string, string[]>();
  for (const id of diff.toAppLibrary) {
    const location = before.get(id);
    if (!location || (location.area === "page" && hiddenPageIndexes.has(location.page ?? -1))) continue;
    const key = sourceKey(location);
    removalsBySource.set(key, [...(removalsBySource.get(key) ?? []), id]);
  }
  for (const [source, ids] of removalsBySource) {
    chunk(ids, REMOVE_CHUNK).forEach((group, index, groups) =>
      add({
        section: "remove",
        title: `Remove from ${source}${groups.length > 1 ? ` (${index + 1}/${groups.length})` : ""}`,
        detail: "Long-press each app, tap Remove App, then Remove from Home Screen. Do not choose Delete App.",
        items: group.map((id) => ({ id, name: nameOf(id), note: describeLocation(before.get(id)) })),
      }),
    );
  }
  if (diff.widgetsRemoved.length > 0) {
    add({
      section: "remove",
      title: "Remove widgets",
      detail: "Long-press each widget and tap Remove Widget.",
      items: diff.widgetsRemoved.map((widget) => ({ id: widget.id, name: widget.name })),
    });
  }

  const into = (folder: string) =>
    [
      ...diff.moves.filter((move) => move.to.folder === folder).map((move) => ({ id: move.id, from: move.from })),
      ...diff.fromAppLibrary.filter((entry) => entry.to.folder === folder).map((entry) => ({ id: entry.id, from: undefined })),
    ].map(({ id, from }) => ({ id, name: nameOf(id), note: describeLocation(from) }));

  for (const change of diff.folders) {
    if (change.kind === "create") {
      const [first, second] = change.appIds;
      add({
        section: "folders",
        title: `Create the "${change.name}" folder`,
        detail: `Drag ${nameOf(first ?? "")} onto ${nameOf(second ?? "")} to make a folder, then open it, long-press the title and rename it to "${change.name}". Add the rest of its apps.`,
        items: into(change.name),
      });
    } else if (change.kind === "rename") {
      add({
        section: "folders",
        title: `Rename "${change.from}" to "${change.name}"`,
        detail: "Open the folder, long-press its title, and type the new name.",
        items: into(change.name).length > 0 ? into(change.name) : undefined,
      });
    } else if (change.kind === "keep") {
      const additions = into(change.name);
      if (additions.length > 0) {
        add({ section: "folders", title: `Add apps to "${change.name}"`, items: additions });
      }
    } else {
      add({
        section: "folders",
        title: `Empty the "${change.name}" folder`,
        detail: "Its apps are moved elsewhere in later steps. The folder disappears once it is empty.",
      });
    }
  }

  const describeTarget = (id: string) =>
    diff.fromAppLibrary.some((entry) => entry.id === id) ? "from App Library" : `from ${describeLocation(before.get(id))}`;

  const dockChanged = proposed.dock.some((item) =>
    item.kind === "folder" ? folderIcons(item).some((icon) => changed.has(icon.id)) : changed.has(item.id),
  ) || current.dock.length !== proposed.dock.length;
  if (dockChanged) {
    add({
      section: "dock",
      title: "Set up the dock",
      detail: "Drag apps out of the dock first, then drop these in, left to right.",
      items: proposed.dock.map((item) =>
        item.kind === "folder"
          ? { id: `folder:${item.name}`, name: `${item.name} folder` }
          : { id: item.id, name: item.name, note: before.get(item.id)?.area === "dock" ? undefined : describeTarget(item.id) },
      ),
    });
  }

  proposed.pages.forEach((page, index) => {
    const pageChanged = page.some((item) =>
      item.kind === "folder"
        ? !before.has(folderIcons(item)[0]?.id ?? "") || before.get(folderIcons(item)[0]?.id ?? "")?.page !== index
        : changed.has(item.id),
    ) || pageIconIds(current.pages[index] ?? []).length !== pageIconIds(page).length;
    if (!pageChanged) return;
    add({
      section: "pages",
      title: `Arrange page ${index + 1}`,
      detail:
        "Place items in this order, left to right and top to bottom. To add apps from the App Library, swipe past the last page, search for the app, and drag it here.",
      items: page.map((item) => {
        if (item.kind === "folder") return { id: `folder:${item.name}`, name: `${item.name} folder` };
        if (item.kind === "widget") {
          const move = diff.widgetsMoved.find((entry) => entry.widget.id === item.id);
          return { id: item.id, name: item.name, note: move ? `widget from Page ${move.fromPage + 1}` : "widget" };
        }
        const from = before.get(item.id);
        const unmoved = from?.area === "page" && from.page === index && !from.folder;
        return { id: item.id, name: item.name, note: unmoved ? undefined : describeTarget(item.id) };
      }),
    });
  });

  if (diff.summary.pagesBefore > diff.summary.pagesAfter || hiddenPages.length > 0) {
    add({
      section: "cleanup",
      title: "Remove leftover pages",
      detail: `You should end with ${diff.summary.pagesAfter} page${diff.summary.pagesAfter === 1 ? "" : "s"}. Tap the page dots, uncheck any extra pages, and optionally tap the minus button to delete them. Their apps stay in the App Library.`,
    });
  }
  add({
    section: "cleanup",
    title: "Tap Done and review",
    detail: "Compare your phone with the After view in AppSense, then run get_current_layout again to double-check.",
  });

  return steps;
}

export function guideToMarkdown(steps: GuideStep[]): string {
  const lines: string[] = [];
  let section: GuideSection | undefined;
  let number = 0;
  for (const step of steps) {
    if (step.section !== section) {
      section = step.section;
      lines.push("", `## ${SECTION_TITLES[section]}`);
    }
    number++;
    lines.push("", `${number}. **${step.title}**`);
    if (step.detail) lines.push(`   ${step.detail}`);
    for (const item of step.items ?? []) lines.push(`   - ${item.name}${item.note ? ` (${item.note})` : ""}`);
  }
  return lines.join("\n").trim();
}
