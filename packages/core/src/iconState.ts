import { paginate } from "./layout.js";
import type { IconItem, Layout, PageItem } from "./schema.js";

type RawElement = Record<string, unknown>;

function isRecord(value: unknown): value is RawElement {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

interface RawIndex {
  icons: Map<string, RawElement>;
  widgets: Map<string, RawElement>;
  folders: Map<string, RawElement>;
}

function indexRawState(raw: unknown[]): RawIndex {
  const index: RawIndex = { icons: new Map(), widgets: new Map(), folders: new Map() };
  const visit = (value: unknown): void => {
    if (Array.isArray(value)) return value.forEach(visit);
    if (!isRecord(value)) return;
    if (value.listType === "folder") {
      if (typeof value.displayName === "string") index.folders.set(value.displayName.toLowerCase(), value);
      visit(value.iconLists);
      return;
    }
    const elementType = value.elementType;
    if (typeof elementType === "string" && elementType !== "app" && elementType !== "icon") {
      if (typeof value.displayIdentifier === "string") index.widgets.set(value.displayIdentifier, value);
      return;
    }
    if (typeof value.webClipURL === "string" || typeof value.bundleIdentifier !== "string") {
      if (typeof value.displayIdentifier === "string") index.icons.set(value.displayIdentifier, value);
    } else {
      index.icons.set(value.bundleIdentifier, value);
    }
  };
  visit(raw);
  return index;
}

function rawIcon(icon: IconItem, index: RawIndex): RawElement {
  return (
    index.icons.get(icon.id) ??
    (icon.kind === "webclip"
      ? { displayIdentifier: icon.id, displayName: icon.name }
      : { bundleIdentifier: icon.id, displayIdentifier: icon.id, displayName: icon.name })
  );
}

function rawItem(item: PageItem, index: RawIndex): RawElement | null {
  if (item.kind === "widget") return index.widgets.get(item.id) ?? null;
  if (item.kind !== "folder") return rawIcon(item, index);
  const existing = index.folders.get(item.name.toLowerCase()) ?? {};
  const icons = item.pages.flat().map((icon) => rawIcon(icon, index));
  return { ...existing, displayName: item.name, listType: "folder", iconLists: paginate(icons) };
}

/**
 * Converts a layout back into SpringBoard's icon state, reusing the device's
 * original element dictionaries so SpringBoard recognizes every icon and widget.
 */
export function toIconState(layout: Layout, raw: unknown): unknown[] {
  if (!Array.isArray(raw)) throw new Error("Unexpected icon state: expected an array of icon lists");
  const index = indexRawState(raw);
  const toList = (items: PageItem[]) => items.map((item) => rawItem(item, index)).filter((item) => item !== null);
  return [toList(layout.dock), ...layout.pages.map(toList)];
}
