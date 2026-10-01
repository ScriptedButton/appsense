import { locateIcons, normalizeIconState, toIconState } from "@appsense/core";
import type { Layout, Location } from "@appsense/core";
import { saveBackup } from "./backups.js";
import type { BackupRef } from "./backups.js";
import { getIconState, setIconState } from "./pymobiledevice.js";
import { invalidateSnapshot } from "./service.js";

export interface ApplyResult {
  backup: BackupRef;
  result: Layout;
  /** Icons the device placed somewhere other than requested. */
  misplaced: string[];
  /** Icons the device kept on the home screen although the layout left them out. */
  kept: string[];
}

function locationKey(location: Location): string {
  return `${location.area}:${location.page ?? ""}:${location.folder ?? ""}:${location.index}`;
}

/** Writes a layout to the device (after backing up the current one) and checks what SpringBoard actually did. */
export async function applyLayout(udid: string, layout: Layout, label: string): Promise<ApplyResult> {
  const before = await getIconState(udid);
  const backup = await saveBackup(udid, before, `before ${label}`);
  const after = await setIconState(udid, toIconState(layout, before));
  invalidateSnapshot(udid);
  const result = normalizeIconState(after);

  const wanted = locateIcons(layout);
  const actual = locateIcons(result);
  const misplaced = [...wanted].filter(([id, location]) => {
    const got = actual.get(id);
    return !got || locationKey(got) !== locationKey(location);
  });
  const kept = [...actual.keys()].filter((id) => !wanted.has(id));
  return { backup, result, misplaced: misplaced.map(([id]) => id), kept };
}

/** Writes a previously saved raw icon state back to the device. */
export async function restoreIconState(udid: string, state: unknown, label: string): Promise<{ backup: BackupRef; result: Layout }> {
  const backup = await saveBackup(udid, await getIconState(udid), `before ${label}`);
  const after = await setIconState(udid, state as unknown[]);
  invalidateSnapshot(udid);
  return { backup, result: normalizeIconState(after) };
}
