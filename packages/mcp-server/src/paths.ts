import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

/** Repository root, resolved from packages/mcp-server/dist. */
export const REPO_ROOT = resolve(here, "..", "..", "..");

export const DATA_DIR = process.env.APPSENSE_DATA_DIR ?? join(homedir(), ".appsense");
export const CACHE_DIR = join(DATA_DIR, "cache");
export const BACKUP_DIR = join(DATA_DIR, "backups");
export const PLANS_DIR = process.env.APPSENSE_PLANS_DIR ?? join(REPO_ROOT, "plans");
export const PREVIEW_DIST = join(REPO_ROOT, "apps", "preview", "dist");

export const PORT = Number(process.env.APPSENSE_PORT ?? 4517);
export const PREVIEW_URL = `http://localhost:${PORT}`;

export const iconPath = (udid: string, bundleId: string) =>
  join(CACHE_DIR, "icons", udid, `${bundleId.replace(/[^\w.-]/g, "_")}.png`);
