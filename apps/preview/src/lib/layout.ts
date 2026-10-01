import type { FolderItem, GuideSection, IconItem, WidgetSize } from "@appsense/core";

export const WIDGET_SPAN: Record<WidgetSize, string> = {
  small: "col-span-2 row-span-2",
  medium: "col-span-4 row-span-2",
  large: "col-span-4 row-span-4",
  extraLarge: "col-span-4 row-span-4",
};

export const SECTION_LABELS: Record<GuideSection, string> = {
  prepare: "Get ready",
  remove: "Clear out",
  folders: "Folders",
  dock: "Dock",
  pages: "Arrange pages",
  cleanup: "Finish up",
};

export const folderIcons = (folder: FolderItem): IconItem[] => folder.pages.flat();

export function initials(name: string): string {
  const words = name.replace(/[^\p{L}\p{N} ]/gu, " ").split(/\s+/).filter(Boolean);
  return (words.length > 1 ? `${words[0]![0]}${words[1]![0]}` : (words[0] ?? "?").slice(0, 2)).toUpperCase();
}

/** Stable hue per app so fallback tiles stay recognizable between views. */
export function hueFor(id: string): number {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) % 360;
  return hash;
}

/** Matches the page step title produced by the guide ("Arrange page 3"). */
export function pageFromStepTitle(title: string): number | null {
  const match = /^Arrange page (\d+)$/.exec(title);
  return match ? Number(match[1]) - 1 : null;
}
