import { access } from "node:fs/promises";
import { normalizeIconState } from "@appsense/core";
import type { Catalog, DeviceRef, IconItem, Layout } from "@appsense/core";
import { iconPath } from "../paths.js";
import { lookupGenres } from "./categories.js";
import { DeviceError, fetchIcon, getIconState, listApps, listUsbmuxDevices, lockdownInfo } from "./pymobiledevice.js";

export interface DeviceStatus {
  udid: string;
  name: string;
  model: string;
  iosVersion: string;
  connections: ("USB" | "Network")[];
  trusted: boolean;
  problem?: string;
}

export interface DeviceSnapshot {
  device: DeviceRef;
  layout: Layout;
  catalog: Catalog;
  fetchedAt: number;
}

const SNAPSHOT_TTL_MS = 2 * 60_000;
const ICON_CONCURRENCY = 3;

const snapshots = new Map<string, DeviceSnapshot>();
const pendingSnapshots = new Map<string, Promise<DeviceSnapshot>>();
const failedIcons = new Set<string>();
const pendingIcons = new Map<string, Promise<string | null>>();
const iconQueue: (() => void)[] = [];
let activeIconFetches = 0;

export async function deviceStatuses(): Promise<DeviceStatus[]> {
  const entries = await listUsbmuxDevices();
  const byUdid = new Map<string, DeviceStatus>();
  for (const entry of entries) {
    const existing = byUdid.get(entry.UniqueDeviceID);
    if (existing) {
      existing.connections.push(entry.ConnectionType);
      continue;
    }
    byUdid.set(entry.UniqueDeviceID, {
      udid: entry.UniqueDeviceID,
      name: entry.DeviceName,
      model: entry.ProductType,
      iosVersion: entry.ProductVersion,
      connections: [entry.ConnectionType],
      trusted: false,
    });
  }
  await Promise.all(
    [...byUdid.values()].map(async (status) => {
      try {
        const info = await lockdownInfo(status.udid);
        status.trusted = info.TrustedHostAttached ?? true;
        if (!status.trusted) status.problem = "Tap Trust on the iPhone.";
      } catch (error) {
        status.problem = error instanceof DeviceError ? [error.message, error.hint].filter(Boolean).join(" ") : String(error);
      }
    }),
  );
  return [...byUdid.values()].sort((a, b) => Number(b.connections.includes("USB")) - Number(a.connections.includes("USB")));
}

export async function resolveDevice(udid?: string): Promise<DeviceRef> {
  const devices = await listUsbmuxDevices();
  if (devices.length === 0) {
    throw new DeviceError("No iPhone is connected.", "Plug the iPhone in over USB, unlock it, and tap Trust.");
  }
  if (udid) {
    const match = devices.find((device) => device.UniqueDeviceID === udid);
    if (!match) throw new DeviceError(`Device ${udid} is not connected.`, "Call device_status to see connected devices.");
    return { udid, name: match.DeviceName };
  }
  const preferred = devices.find((device) => device.ConnectionType === "USB") ?? devices[0]!;
  return { udid: preferred.UniqueDeviceID, name: preferred.DeviceName };
}

function iconsOf(layout: Layout): IconItem[] {
  return [...layout.dock, ...layout.pages.flat()].flatMap((item) =>
    item.kind === "folder" ? item.pages.flat() : item.kind === "widget" ? [] : [item],
  );
}

async function buildSnapshot(device: DeviceRef): Promise<DeviceSnapshot> {
  const [rawState, apps] = await Promise.all([getIconState(device.udid), listApps(device.udid)]);
  const layout = normalizeIconState(rawState);

  const catalog: Catalog = {};
  for (const app of Object.values(apps)) {
    const id = app.CFBundleIdentifier;
    const type = app.ApplicationType;
    if (!id || (type !== "User" && type !== "System") || app.IsAppClip) continue;
    if (app.SBAppTags?.includes("hidden")) continue;
    catalog[id] = {
      id,
      name: app.CFBundleDisplayName ?? app.CFBundleName ?? id,
      genre: null,
      kind: "app",
      system: type === "System",
    };
  }
  for (const icon of iconsOf(layout)) {
    const entry = catalog[icon.id];
    if (entry) entry.name = icon.name;
    else catalog[icon.id] = { id: icon.id, name: icon.name, genre: null, kind: icon.kind, system: icon.id.startsWith("com.apple.") };
  }

  const appIds = Object.values(catalog).filter((entry) => entry.kind === "app").map((entry) => entry.id);
  const genres = await lookupGenres(appIds);
  for (const id of appIds) {
    const entry = catalog[id]!;
    entry.genre = genres[id] ?? (entry.system ? "Apple" : null);
  }
  return { device, layout, catalog, fetchedAt: Date.now() };
}

/** Reads layout and installed apps from the device, cached briefly to keep tool calls fast. */
export async function getSnapshot(udid?: string, options: { refresh?: boolean } = {}): Promise<DeviceSnapshot> {
  const device = await resolveDevice(udid);
  const cached = snapshots.get(device.udid);
  if (cached && !options.refresh && Date.now() - cached.fetchedAt < SNAPSHOT_TTL_MS) return cached;
  let pending = pendingSnapshots.get(device.udid);
  if (!pending) {
    pending = buildSnapshot(device).finally(() => pendingSnapshots.delete(device.udid));
    pendingSnapshots.set(device.udid, pending);
  }
  const snapshot = await pending;
  snapshots.set(device.udid, snapshot);
  return snapshot;
}

export function invalidateSnapshot(udid: string): void {
  snapshots.delete(udid);
}

function withIconSlot<T>(task: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const run = () => {
      activeIconFetches++;
      task()
        .then(resolve, reject)
        .finally(() => {
          activeIconFetches--;
          iconQueue.shift()?.();
        });
    };
    if (activeIconFetches < ICON_CONCURRENCY) run();
    else iconQueue.push(run);
  });
}

/** Returns a cached PNG path for an app icon, fetching it from the device when needed. */
export function getIcon(udid: string, bundleId: string): Promise<string | null> {
  const path = iconPath(udid, bundleId);
  const key = `${udid}/${bundleId}`;
  if (failedIcons.has(key)) return Promise.resolve(null);
  const existing = pendingIcons.get(key);
  if (existing) return existing;
  const pending = access(path)
    .then(() => path)
    .catch(() =>
      withIconSlot(() => fetchIcon(udid, bundleId, path))
        .then(() => path)
        .catch(() => {
          failedIcons.add(key);
          return null;
        }),
    )
    .finally(() => pendingIcons.delete(key));
  pendingIcons.set(key, pending);
  return pending;
}

/** Warms the icon cache in the background for the given bundle ids. */
export function prefetchIcons(udid: string, bundleIds: string[]): void {
  for (const id of bundleIds) void getIcon(udid, id);
}
