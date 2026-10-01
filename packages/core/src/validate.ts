import { foldersOf, locateIcons, paginate, pageSlots, widgetsOf } from "./layout.js";
import { GRID } from "./schema.js";
import type {
  Catalog,
  DockItem,
  FolderItem,
  IconItem,
  Layout,
  LayoutSpec,
  PageItem,
  SpecDockEntry,
  SpecPageEntry,
} from "./schema.js";

export type IssueCode =
  | "unknown_id"
  | "duplicate"
  | "dock_full"
  | "page_full"
  | "too_many_pages"
  | "folder_too_small"
  | "folder_too_large"
  | "unknown_widget"
  | "unplaced_apps"
  | "empty_page"
  | "widget_removed"
  | "duplicate_folder_name"
  | "sent_to_app_library";

export interface Issue {
  code: IssueCode;
  message: string;
  ids?: string[];
}

export interface ValidationResult {
  ok: boolean;
  errors: Issue[];
  warnings: Issue[];
  layout: Layout;
  appLibrary: string[];
}

export interface ValidateOptions {
  current: Layout;
  catalog: Catalog;
  /** Treat every home screen app missing from the spec as sent to the App Library. */
  sendUnlistedToAppLibrary?: boolean;
}

const MAX_LISTED_IDS = 40;

function listIds(ids: string[], nameOf: (id: string) => string): string {
  const shown = ids.slice(0, MAX_LISTED_IDS).map((id) => `${nameOf(id)} (${id})`);
  const more = ids.length > MAX_LISTED_IDS ? `, and ${ids.length - MAX_LISTED_IDS} more` : "";
  return shown.join(", ") + more;
}

export function validateSpec(spec: LayoutSpec, options: ValidateOptions): ValidationResult {
  const { current, catalog } = options;
  const errors: Issue[] = [];
  const warnings: Issue[] = [];

  const currentLocations = locateIcons(current);
  const currentIcons = new Map<string, IconItem>();
  for (const item of [...current.dock, ...current.pages.flat()]) {
    if (item.kind === "folder") item.pages.flat().forEach((icon) => currentIcons.set(icon.id, icon));
    else if (item.kind !== "widget") currentIcons.set(item.id, item);
  }
  const currentWidgets = widgetsOf(current);
  const nameOf = (id: string) => catalog[id]?.name ?? currentIcons.get(id)?.name ?? id;

  const placed = new Map<string, string>();
  const usedWidgets = new Set<string>();

  const suggestId = (raw: string): string | undefined => {
    const needle = raw.trim().toLowerCase();
    const match = Object.values(catalog).find((entry) => entry.name.toLowerCase() === needle);
    return match?.id ?? [...currentIcons.values()].find((icon) => icon.name.toLowerCase() === needle)?.id;
  };

  const resolveIcon = (id: string, where: string): IconItem | null => {
    const known = currentIcons.get(id);
    const entry = catalog[id];
    if (!known && !entry) {
      const suggestion = suggestId(id);
      errors.push({
        code: "unknown_id",
        message: `Unknown app "${id}" in ${where}.${suggestion ? ` Did you mean "${suggestion}"?` : " Use bundle ids from list_installed_apps."}`,
        ids: [id],
      });
      return null;
    }
    const previous = placed.get(id);
    if (previous) {
      errors.push({
        code: "duplicate",
        message: `${nameOf(id)} (${id}) is placed twice: in ${previous} and in ${where}.`,
        ids: [id],
      });
      return null;
    }
    placed.set(id, where);
    if (known) return known;
    return entry!.kind === "webclip"
      ? { kind: "webclip", id, name: entry!.name }
      : { kind: "app", id, name: entry!.name };
  };

  const resolveFolder = (entry: { folder: string; apps: string[] }, where: string): FolderItem => {
    const name = entry.folder.trim();
    const label = `${where} > "${name}" folder`;
    const icons = entry.apps
      .map((id) => resolveIcon(id, label))
      .filter((icon): icon is IconItem => icon !== null);
    if (entry.apps.length < 2) {
      errors.push({ code: "folder_too_small", message: `Folder "${name}" in ${where} needs at least 2 apps.` });
    }
    const max = GRID.folderSlotsPerPage * GRID.maxFolderPages;
    if (entry.apps.length > max) {
      errors.push({ code: "folder_too_large", message: `Folder "${name}" has ${entry.apps.length} apps; the limit is ${max}.` });
    }
    return { kind: "folder", name, pages: paginate(icons) };
  };

  const resolveEntry = (entry: SpecPageEntry | SpecDockEntry, where: string): PageItem | null => {
    if (typeof entry === "string") return resolveIcon(entry, where);
    if ("folder" in entry) return resolveFolder(entry, where);
    const found = currentWidgets.get(entry.widget);
    if (!found) {
      errors.push({
        code: "unknown_widget",
        message: `Unknown widget "${entry.widget}" in ${where}. Only existing widgets from get_current_layout can be placed.`,
      });
      return null;
    }
    if (usedWidgets.has(entry.widget)) {
      errors.push({ code: "duplicate", message: `Widget "${found.widget.name}" (${entry.widget}) is placed twice.` });
      return null;
    }
    usedWidgets.add(entry.widget);
    return found.widget;
  };

  if (spec.dock.length > GRID.dockSlots) {
    errors.push({ code: "dock_full", message: `The dock holds ${GRID.dockSlots} items; the proposal has ${spec.dock.length}.` });
  }
  const dock = spec.dock
    .map((entry) => resolveEntry(entry, "Dock"))
    .filter((item): item is DockItem => item !== null && item.kind !== "widget");

  const pages: PageItem[][] = [];
  spec.pages.forEach((rawPage, index) => {
    if (rawPage.length === 0) {
      warnings.push({ code: "empty_page", message: `Page ${index + 1} is empty and was dropped.` });
      return;
    }
    const where = `Page ${pages.length + 1}`;
    const page = rawPage.map((entry) => resolveEntry(entry, where)).filter((item): item is PageItem => item !== null);
    const unresolved = rawPage.length - page.length;
    const slots = pageSlots(page) + unresolved;
    if (slots > GRID.slotsPerPage) {
      errors.push({
        code: "page_full",
        message: `${where} uses ${slots} of ${GRID.slotsPerPage} slots (small widget = 4, medium = 8, large = 16). Move some items to another page.`,
      });
    }
    pages.push(page);
  });
  if (pages.length > GRID.maxPages) {
    errors.push({ code: "too_many_pages", message: `iOS allows ${GRID.maxPages} home screen pages; the proposal has ${pages.length}.` });
  }

  const appLibrary: string[] = [];
  for (const id of spec.appLibrary ?? []) {
    if (!currentIcons.has(id) && !catalog[id]) {
      errors.push({ code: "unknown_id", message: `Unknown app "${id}" in appLibrary.`, ids: [id] });
      continue;
    }
    if (placed.has(id)) {
      errors.push({ code: "duplicate", message: `${nameOf(id)} (${id}) is both placed in ${placed.get(id)} and sent to the App Library.`, ids: [id] });
      continue;
    }
    appLibrary.push(id);
  }

  const handled = new Set([...placed.keys(), ...appLibrary]);
  const missing = [...currentLocations.keys()].filter((id) => !handled.has(id));
  if (missing.length > 0) {
    if (options.sendUnlistedToAppLibrary) {
      appLibrary.push(...missing);
      warnings.push({
        code: "sent_to_app_library",
        message: `${missing.length} app(s) not mentioned in the proposal will be removed to the App Library.`,
        ids: missing,
      });
    } else {
      errors.push({
        code: "unplaced_apps",
        message: `${missing.length} app(s) on the current home screen are neither placed nor listed in appLibrary: ${listIds(missing, nameOf)}. Place them, add them to appLibrary, or set sendUnlistedToAppLibrary.`,
        ids: missing,
      });
    }
  }

  const droppedWidgets = [...currentWidgets.values()].filter(({ widget }) => !usedWidgets.has(widget.id));
  if (droppedWidgets.length > 0) {
    warnings.push({
      code: "widget_removed",
      message: `These widgets are not in the proposal and will be removed: ${droppedWidgets.map(({ widget }) => `${widget.name} (${widget.id})`).join(", ")}.`,
    });
  }

  const layout: Layout = { dock, pages };
  const folderNames = foldersOf(layout).map((folder) => folder.name.toLowerCase());
  const duplicateNames = [...new Set(folderNames.filter((name, i) => folderNames.indexOf(name) !== i))];
  if (duplicateNames.length > 0) {
    warnings.push({ code: "duplicate_folder_name", message: `Multiple folders share a name: ${duplicateNames.join(", ")}.` });
  }

  return { ok: errors.length === 0, errors, warnings, layout, appLibrary };
}
