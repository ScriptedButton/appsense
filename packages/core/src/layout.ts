import { GRID, WIDGET_FOOTPRINT } from "./schema.js";
import type { FolderItem, IconItem, Layout, LayoutSpec, PageItem, WidgetItem } from "./schema.js";

export interface Location {
  area: "dock" | "page";
  /** Zero-based page index (only for area "page"). */
  page?: number;
  /** Folder name when the icon sits inside a folder. */
  folder?: string;
  /** Position within the dock, page, or folder (flattened across folder pages). */
  index: number;
}

export function slotsOf(item: PageItem): number {
  if (item.kind !== "widget") return 1;
  const [cols, rows] = WIDGET_FOOTPRINT[item.size];
  return cols * rows;
}

export function pageSlots(page: PageItem[]): number {
  return page.reduce((sum, item) => sum + slotsOf(item), 0);
}

export function folderIcons(folder: FolderItem): IconItem[] {
  return folder.pages.flat();
}

export function paginate<T>(items: T[], size: number = GRID.folderSlotsPerPage): T[][] {
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += size) pages.push(items.slice(i, i + size));
  return pages;
}

function locateItems(items: PageItem[], base: Omit<Location, "index">, into: Map<string, Location>): void {
  items.forEach((item, index) => {
    if (item.kind === "folder") {
      folderIcons(item).forEach((icon, folderIndex) =>
        into.set(icon.id, { ...base, folder: item.name, index: folderIndex }),
      );
    } else if (item.kind !== "widget") {
      into.set(item.id, { ...base, index });
    }
  });
}

/** Maps every app and web clip id on the home screen to where it sits. */
export function locateIcons(layout: Layout): Map<string, Location> {
  const locations = new Map<string, Location>();
  locateItems(layout.dock, { area: "dock" }, locations);
  layout.pages.forEach((page, pageIndex) => locateItems(page, { area: "page", page: pageIndex }, locations));
  return locations;
}

export function widgetsOf(layout: Layout): Map<string, { widget: WidgetItem; page: number }> {
  const widgets = new Map<string, { widget: WidgetItem; page: number }>();
  layout.pages.forEach((page, pageIndex) =>
    page.forEach((item) => {
      if (item.kind === "widget") widgets.set(item.id, { widget: item, page: pageIndex });
    }),
  );
  return widgets;
}

export function foldersOf(layout: Layout): FolderItem[] {
  return [...layout.dock, ...layout.pages.flat()].filter((item): item is FolderItem => item.kind === "folder");
}

export function describeLocation(location: Location | undefined): string {
  if (!location) return "App Library";
  const where = location.area === "dock" ? "Dock" : `Page ${(location.page ?? 0) + 1}`;
  return location.folder ? `${where} > ${location.folder} folder` : where;
}

/** Converts a full layout into the compact spec format the agent works with. */
export function layoutToSpec(layout: Layout): LayoutSpec {
  const toEntry = (item: PageItem) => {
    if (item.kind === "folder") return { folder: item.name, apps: folderIcons(item).map((icon) => icon.id) };
    if (item.kind === "widget") return { widget: item.id };
    return item.id;
  };
  return {
    dock: layout.dock.map((item) => toEntry(item) as LayoutSpec["dock"][number]),
    pages: layout.pages.map((page) => page.map(toEntry)),
  };
}
