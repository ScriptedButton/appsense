import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { BACKUP_DIR } from "../paths.js";

export interface BackupRef {
  id: string;
  udid: string;
  createdAt: string;
  label: string;
}

const BACKUP_ID = /^[\w-]+$/;

const dirFor = (udid: string) => join(BACKUP_DIR, udid);

/** Saves the raw SpringBoard icon state so a layout change can be undone. */
export async function saveBackup(udid: string, rawState: unknown, label: string): Promise<BackupRef> {
  const now = new Date();
  const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "backup";
  const id = `${now.toISOString().slice(0, 19).replace(/[-:T]/g, "")}-${slug}`;
  await mkdir(dirFor(udid), { recursive: true });
  await writeFile(join(dirFor(udid), `${id}.json`), JSON.stringify({ label, createdAt: now.toISOString(), state: rawState }));
  return { id, udid, createdAt: now.toISOString(), label };
}

export async function loadBackup(udid: string, id: string): Promise<{ ref: BackupRef; state: unknown } | null> {
  if (!BACKUP_ID.test(id)) return null;
  try {
    const data = JSON.parse(await readFile(join(dirFor(udid), `${id}.json`), "utf8")) as {
      label: string;
      createdAt: string;
      state: unknown;
    };
    return { ref: { id, udid, createdAt: data.createdAt, label: data.label }, state: data.state };
  } catch {
    return null;
  }
}

/** Newest first. */
export async function listBackups(udid: string): Promise<BackupRef[]> {
  let files: string[];
  try {
    files = await readdir(dirFor(udid));
  } catch {
    return [];
  }
  const ids = files.filter((file) => file.endsWith(".json")).map((file) => file.slice(0, -".json".length));
  const backups = await Promise.all(ids.map((id) => loadBackup(udid, id)));
  return backups
    .filter((backup): backup is NonNullable<typeof backup> => backup !== null)
    .map((backup) => backup.ref)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
