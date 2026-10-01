import { z } from "zod";

export const GRID = {
  columns: 4,
  rows: 6,
  slotsPerPage: 24,
  dockSlots: 4,
  maxPages: 15,
  folderSlotsPerPage: 9,
  maxFolderPages: 15,
} as const;

export const WidgetSizeSchema = z.enum(["small", "medium", "large", "extraLarge"]);
export type WidgetSize = z.infer<typeof WidgetSizeSchema>;

/** Grid footprint of each widget size as [columns, rows]. */
export const WIDGET_FOOTPRINT: Record<WidgetSize, [number, number]> = {
  small: [2, 2],
  medium: [4, 2],
  large: [4, 4],
  extraLarge: [4, 4],
};

export const AppItemSchema = z.object({
  kind: z.literal("app"),
  id: z.string(),
  name: z.string(),
});

export const WebClipItemSchema = z.object({
  kind: z.literal("webclip"),
  id: z.string(),
  name: z.string(),
  url: z.string().optional(),
});

export const IconItemSchema = z.discriminatedUnion("kind", [AppItemSchema, WebClipItemSchema]);

export const FolderItemSchema = z.object({
  kind: z.literal("folder"),
  name: z.string(),
  pages: z.array(z.array(IconItemSchema)),
});

export const WidgetItemSchema = z.object({
  kind: z.literal("widget"),
  /** SpringBoard displayIdentifier; stable per placed widget instance. */
  id: z.string(),
  name: z.string(),
  size: WidgetSizeSchema,
  /** Bundle id of the app providing the widget, used for its icon. */
  containerId: z.string().optional(),
  isStack: z.boolean().optional(),
});

export const PageItemSchema = z.discriminatedUnion("kind", [
  AppItemSchema,
  WebClipItemSchema,
  FolderItemSchema,
  WidgetItemSchema,
]);

export const DockItemSchema = z.discriminatedUnion("kind", [
  AppItemSchema,
  WebClipItemSchema,
  FolderItemSchema,
]);

export const LayoutSchema = z.object({
  dock: z.array(DockItemSchema),
  pages: z.array(z.array(PageItemSchema)),
});

export type AppItem = z.infer<typeof AppItemSchema>;
export type WebClipItem = z.infer<typeof WebClipItemSchema>;
export type IconItem = z.infer<typeof IconItemSchema>;
export type FolderItem = z.infer<typeof FolderItemSchema>;
export type WidgetItem = z.infer<typeof WidgetItemSchema>;
export type PageItem = z.infer<typeof PageItemSchema>;
export type DockItem = z.infer<typeof DockItemSchema>;
export type Layout = z.infer<typeof LayoutSchema>;

/**
 * Compact layout format exchanged with the AI agent. Strings are app bundle ids
 * (or web clip ids); folders list their apps flat and are paginated automatically.
 */
export const SpecFolderSchema = z.object({
  folder: z.string().min(1).describe("Folder name shown on the home screen"),
  apps: z.array(z.string()).describe("Bundle ids in display order; paginated 9 per folder page"),
});

export const SpecWidgetSchema = z.object({
  widget: z.string().describe("Widget id from get_current_layout (existing widgets only)"),
});

export const SpecPageEntrySchema = z.union([z.string(), SpecFolderSchema, SpecWidgetSchema]);
export const SpecDockEntrySchema = z.union([z.string(), SpecFolderSchema]);

export const LayoutSpecSchema = z.object({
  dock: z.array(SpecDockEntrySchema).describe("Up to 4 bundle ids or folders"),
  pages: z
    .array(z.array(SpecPageEntrySchema))
    .describe("Home screen pages in order; each page holds up to 24 slots (widgets use 4, 8 or 16)"),
  appLibrary: z
    .array(z.string())
    .optional()
    .describe("Bundle ids to remove from the home screen (still available in the App Library)"),
});

export type SpecFolder = z.infer<typeof SpecFolderSchema>;
export type SpecWidget = z.infer<typeof SpecWidgetSchema>;
export type SpecPageEntry = z.infer<typeof SpecPageEntrySchema>;
export type SpecDockEntry = z.infer<typeof SpecDockEntrySchema>;
export type LayoutSpec = z.infer<typeof LayoutSpecSchema>;

export const CatalogEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  genre: z.string().nullable(),
  kind: z.enum(["app", "webclip"]),
  system: z.boolean(),
});

export type CatalogEntry = z.infer<typeof CatalogEntrySchema>;
export type Catalog = Record<string, CatalogEntry>;
