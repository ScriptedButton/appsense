import type { DockItem, IconItem, Layout, PageItem, WidgetItem, WidgetSize } from "./schema.js";

type RawElement = Record<string, unknown>;

const WIDGET_SIZES = new Set<WidgetSize>(["small", "medium", "large", "extraLarge"]);

let anonymousWidgetCount = 0;

function str(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function isRecord(value: unknown): value is RawElement {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeIcon(raw: RawElement): IconItem | null {
  const bundleId = str(raw.bundleIdentifier);
  const name = str(raw.displayName) ?? bundleId ?? "Untitled";
  if (str(raw.webClipURL) || !bundleId) {
    const id = str(raw.displayIdentifier);
    if (!id) return null;
    return { kind: "webclip", id, name, url: str(raw.webClipURL) };
  }
  return { kind: "app", id: bundleId, name };
}

/** "com.apple.Batteries" -> "Batteries" */
function humanizeBundleId(id: string | undefined): string | undefined {
  const last = id?.split(".").pop();
  return last ? last.replace(/([a-z])([A-Z])/g, "$1 $2") : undefined;
}

function normalizeWidget(raw: RawElement, nameOf: (id: string) => string | undefined): WidgetItem {
  const rawSize = str(raw.gridSize) as WidgetSize | undefined;
  const containerId = str(raw.containerBundleIdentifier) ?? str(raw.widgetIdentifier);
  const iconLists = Array.isArray(raw.iconLists) ? raw.iconLists : [];
  const isStack = str(raw.elementType) === "stack" || iconLists.flat().length > 1;
  const baseName =
    (containerId && nameOf(containerId)) ?? str(raw.displayName) ?? humanizeBundleId(containerId) ?? "Widget";
  return {
    kind: "widget",
    id: str(raw.displayIdentifier) ?? `${containerId ?? "widget"}#${++anonymousWidgetCount}`,
    name: isStack ? `Smart Stack` : `${baseName} widget`,
    size: rawSize && WIDGET_SIZES.has(rawSize) ? rawSize : "small",
    containerId,
    isStack: isStack || undefined,
  };
}

function normalizeElement(raw: unknown, nameOf: (id: string) => string | undefined): PageItem | null {
  if (!isRecord(raw)) return null;
  if (raw.listType === "folder") {
    const lists = Array.isArray(raw.iconLists) ? raw.iconLists : [];
    const pages = lists
      .map((list) => (Array.isArray(list) ? list : []).filter(isRecord).map(normalizeIcon))
      .map((page) => page.filter((item): item is IconItem => item !== null))
      .filter((page) => page.length > 0);
    return { kind: "folder", name: str(raw.displayName) ?? "Folder", pages };
  }
  const elementType = str(raw.elementType);
  if (elementType && elementType !== "app" && elementType !== "icon") {
    return normalizeWidget(raw, nameOf);
  }
  return normalizeIcon(raw);
}

/**
 * Converts the raw SpringBoard icon state (as returned by
 * `pymobiledevice3 springboard state get`) into a Layout. The first list is
 * the dock; the remaining lists are home screen pages.
 */
export function normalizeIconState(raw: unknown): Layout {
  if (!Array.isArray(raw)) {
    throw new Error("Unexpected icon state: expected an array of icon lists");
  }
  anonymousWidgetCount = 0;
  const appNames = new Map<string, string>();
  const collect = (value: unknown): void => {
    if (Array.isArray(value)) return value.forEach(collect);
    if (!isRecord(value)) return;
    const id = str(value.bundleIdentifier);
    const name = str(value.displayName);
    if (id && name && !str(value.elementType)) appNames.set(id, name);
    if (Array.isArray(value.iconLists)) collect(value.iconLists);
  };
  collect(raw);
  const nameOf = (id: string) => appNames.get(id);

  const [rawDock = [], ...rawPages] = raw as unknown[];
  const toItems = (list: unknown) =>
    (Array.isArray(list) ? list : [])
      .map((element) => normalizeElement(element, nameOf))
      .filter((item): item is PageItem => item !== null);

  const dock = toItems(rawDock).filter((item): item is DockItem => item.kind !== "widget");
  const pages = rawPages.map(toItems).filter((page) => page.length > 0);
  return { dock, pages };
}
