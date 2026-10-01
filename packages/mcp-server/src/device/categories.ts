import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { CACHE_DIR } from "../paths.js";

const CACHE_FILE = join(CACHE_DIR, "genres.json");
const BATCH_SIZE = 50;
const PARALLEL_BATCHES = 3;
const COUNTRY = process.env.APPSENSE_STORE_COUNTRY ?? "us";

/** bundle id -> App Store primary genre, or null when the store has no listing. */
type GenreCache = Record<string, string | null>;

let cache: GenreCache | undefined;

async function loadCache(): Promise<GenreCache> {
  if (cache) return cache;
  try {
    cache = JSON.parse(await readFile(CACHE_FILE, "utf8")) as GenreCache;
  } catch {
    cache = {};
  }
  return cache;
}

async function saveCache(data: GenreCache): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(CACHE_FILE, JSON.stringify(data, null, 2));
}

interface LookupResponse {
  results: { bundleId?: string; primaryGenreName?: string }[];
}

async function lookupBatch(ids: string[]): Promise<GenreCache | null> {
  const url = `https://itunes.apple.com/lookup?entity=software&country=${COUNTRY}&bundleId=${ids.map(encodeURIComponent).join(",")}`;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!response.ok) return null;
    const body = (await response.json()) as LookupResponse;
    const found: GenreCache = Object.fromEntries(ids.map((id) => [id, null]));
    for (const result of body.results) {
      if (result.bundleId && result.bundleId in found) found[result.bundleId] = result.primaryGenreName ?? null;
    }
    return found;
  } catch {
    return null;
  }
}

/**
 * Resolves App Store genres for bundle ids, caching results on disk. Network
 * failures are not cached so a later call can fill the gaps.
 */
export async function lookupGenres(ids: string[]): Promise<GenreCache> {
  const known = await loadCache();
  const missing = [...new Set(ids)].filter((id) => !(id in known));
  const batches: string[][] = [];
  for (let i = 0; i < missing.length; i += BATCH_SIZE) batches.push(missing.slice(i, i + BATCH_SIZE));

  let changed = false;
  for (let i = 0; i < batches.length; i += PARALLEL_BATCHES) {
    const results = await Promise.all(batches.slice(i, i + PARALLEL_BATCHES).map(lookupBatch));
    for (const result of results) {
      if (!result) continue;
      Object.assign(known, result);
      changed = true;
    }
  }
  if (changed) await saveCache(known);
  return Object.fromEntries(ids.map((id) => [id, known[id] ?? null]));
}
