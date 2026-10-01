import { folderIcons, foldersOf, locateIcons, widgetsOf } from "./layout.js";
import type { Location } from "./layout.js";
import type { FolderItem, Layout, WidgetItem } from "./schema.js";

export type FolderChangeKind = "create" | "rename" | "keep" | "remove";

export interface FolderChange {
  kind: FolderChangeKind;
  /** Name in the proposed layout (or the current name for "remove"). */
  name: string;
  /** Current name, when an existing folder is reused under a new name. */
  from?: string;
  appIds: string[];
}

export interface IconMove {
  id: string;
  from: Location;
  to: Location;
}

export interface WidgetMove {
  widget: WidgetItem;
  fromPage: number;
  toPage: number;
}

export interface DiffSummary {
  unchanged: number;
  moved: number;
  reordered: number;
  toAppLibrary: number;
  fromAppLibrary: number;
  foldersCreated: number;
  foldersRenamed: number;
  foldersRemoved: number;
  widgetsMoved: number;
  widgetsRemoved: number;
  pagesBefore: number;
  pagesAfter: number;
}

export interface LayoutDiff {
  summary: DiffSummary;
  /** Icons that change container (dock, page, or folder). */
  moves: IconMove[];
  /** Icons that stay in the same container but change position. */
  reorders: IconMove[];
  toAppLibrary: string[];
  fromAppLibrary: { id: string; to: Location }[];
  folders: FolderChange[];
  widgetsMoved: WidgetMove[];
  widgetsRemoved: WidgetItem[];
  /** Ids of every icon or widget that changes in any way, for highlighting. */
  changedIds: string[];
}

const ids = (folder: FolderItem) => folderIcons(folder).map((icon) => icon.id);

/**
 * Pairs proposed folders with current ones: same name first, otherwise the
 * current folder sharing most apps (at least 2 and half its contents).
 */
export function matchFolders(current: Layout, proposed: Layout): FolderChange[] {
  const available = foldersOf(current);
  const changes: FolderChange[] = [];
  const take = (folder: FolderItem) => available.splice(available.indexOf(folder), 1);

  for (const folder of foldersOf(proposed)) {
    const appIds = ids(folder);
    const sameName = available.find((candidate) => candidate.name.toLowerCase() === folder.name.toLowerCase());
    if (sameName) {
      take(sameName);
      changes.push({ kind: "keep", name: folder.name, from: sameName.name, appIds });
      continue;
    }
    let best: { folder: FolderItem; overlap: number } | undefined;
    for (const candidate of available) {
      const candidateIds = new Set(ids(candidate));
      const overlap = appIds.filter((id) => candidateIds.has(id)).length;
      if (overlap >= 2 && overlap >= candidateIds.size / 2 && overlap > (best?.overlap ?? 0)) {
        best = { folder: candidate, overlap };
      }
    }
    if (best) {
      take(best.folder);
      changes.push({ kind: "rename", name: folder.name, from: best.folder.name, appIds });
    } else {
      changes.push({ kind: "create", name: folder.name, appIds });
    }
  }
  for (const leftover of available) changes.push({ kind: "remove", name: leftover.name, appIds: ids(leftover) });
  return changes;
}

function containerKey(location: Location, folderAlias: Map<string, string>): string {
  const folder = location.folder ? folderAlias.get(location.folder) ?? location.folder : "";
  return `${location.area}:${location.page ?? ""}:${folder}`;
}

export function diffLayouts(current: Layout, proposed: Layout, appLibrary: string[]): LayoutDiff {
  const before = locateIcons(current);
  const after = locateIcons(proposed);
  const folders = matchFolders(current, proposed);
  const folderAlias = new Map<string, string>();
  for (const change of folders) {
    if (change.from) folderAlias.set(change.from, change.name);
  }

  const moves: IconMove[] = [];
  const reorders: IconMove[] = [];
  const fromAppLibrary: LayoutDiff["fromAppLibrary"] = [];
  let unchanged = 0;

  for (const [id, to] of after) {
    const from = before.get(id);
    if (!from) {
      fromAppLibrary.push({ id, to });
    } else if (containerKey(from, folderAlias) !== containerKey(to, new Map())) {
      moves.push({ id, from, to });
    } else if (from.index !== to.index) {
      reorders.push({ id, from, to });
    } else {
      unchanged++;
    }
  }

  const libraryIds = new Set(appLibrary);
  const toAppLibrary = [...before.keys()].filter((id) => !after.has(id) && libraryIds.has(id));

  const widgetsBefore = widgetsOf(current);
  const widgetsAfter = widgetsOf(proposed);
  const widgetsMoved: WidgetMove[] = [];
  for (const [id, { widget, page }] of widgetsAfter) {
    const previous = widgetsBefore.get(id);
    if (previous && previous.page !== page) widgetsMoved.push({ widget, fromPage: previous.page, toPage: page });
  }
  const widgetsRemoved = [...widgetsBefore.values()]
    .filter(({ widget }) => !widgetsAfter.has(widget.id))
    .map(({ widget }) => widget);

  const changedIds = [
    ...moves.map((move) => move.id),
    ...reorders.map((move) => move.id),
    ...fromAppLibrary.map((entry) => entry.id),
    ...widgetsMoved.map((move) => move.widget.id),
  ];

  return {
    summary: {
      unchanged,
      moved: moves.length,
      reordered: reorders.length,
      toAppLibrary: toAppLibrary.length,
      fromAppLibrary: fromAppLibrary.length,
      foldersCreated: folders.filter((change) => change.kind === "create").length,
      foldersRenamed: folders.filter((change) => change.kind === "rename").length,
      foldersRemoved: folders.filter((change) => change.kind === "remove").length,
      widgetsMoved: widgetsMoved.length,
      widgetsRemoved: widgetsRemoved.length,
      pagesBefore: current.pages.length,
      pagesAfter: proposed.pages.length,
    },
    moves,
    reorders,
    toAppLibrary,
    fromAppLibrary,
    folders,
    widgetsMoved,
    widgetsRemoved,
    changedIds,
  };
}
