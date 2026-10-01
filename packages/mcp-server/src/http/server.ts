import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import type { IncomingMessage, Server, ServerResponse } from "node:http";
import { extname, join, normalize, sep } from "node:path";
import { getIcon } from "../device/service.js";
import { PORT, PREVIEW_DIST } from "../paths.js";
import { listPlans, loadPlan } from "../plans/store.js";

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".json": "application/json",
  ".woff2": "font/woff2",
};

const SAFE_SEGMENT = /^[\w.-]+$/;

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "content-type": "application/json", "cache-control": "no-store" });
  res.end(JSON.stringify(body));
}

async function sendFile(res: ServerResponse, path: string, cacheControl: string): Promise<boolean> {
  try {
    const info = await stat(path);
    if (!info.isFile()) return false;
  } catch {
    return false;
  }
  res.writeHead(200, {
    "content-type": MIME[extname(path)] ?? "application/octet-stream",
    "cache-control": cacheControl,
  });
  createReadStream(path).pipe(res);
  return true;
}

async function serveStatic(pathname: string, res: ServerResponse): Promise<void> {
  const target = normalize(join(PREVIEW_DIST, decodeURIComponent(pathname)));
  if (!target.startsWith(PREVIEW_DIST + sep) && target !== PREVIEW_DIST) {
    res.writeHead(403).end();
    return;
  }
  const immutable = pathname.startsWith("/assets/") ? "public, max-age=31536000, immutable" : "no-cache";
  if (pathname !== "/" && (await sendFile(res, target, immutable))) return;
  if (await sendFile(res, join(PREVIEW_DIST, "index.html"), "no-cache")) return;
  res.writeHead(503, { "content-type": "text/plain; charset=utf-8" });
  res.end("AppSense preview is not built yet. Run `pnpm build` in the repository root.");
}

async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405).end();
    return;
  }
  const { pathname } = new URL(req.url ?? "/", "http://localhost");
  const segments = pathname.split("/").filter(Boolean);

  if (segments[0] !== "api") return serveStatic(pathname, res);

  if (segments[1] === "plans" && segments.length === 2) return sendJson(res, 200, await listPlans());
  if (segments[1] === "plans" && segments.length === 3) {
    const plan = await loadPlan(segments[2]!);
    return plan ? sendJson(res, 200, plan) : sendJson(res, 404, { error: "Plan not found" });
  }
  if (segments[1] === "icons" && segments.length === 4) {
    const [, , udid, bundleId] = segments as [string, string, string, string];
    if (!SAFE_SEGMENT.test(udid) || !SAFE_SEGMENT.test(bundleId)) return sendJson(res, 400, { error: "Bad id" });
    const path = await getIcon(udid, bundleId);
    if (path && (await sendFile(res, path, "public, max-age=86400"))) return;
    return sendJson(res, 404, { error: "Icon unavailable" });
  }
  sendJson(res, 404, { error: "Not found" });
}

let starting: Promise<Server | null> | undefined;

/**
 * Starts the preview server once per process. If the port is taken, another
 * AppSense instance is assumed to be serving the same plans directory.
 */
export function ensureHttpServer(): Promise<Server | null> {
  starting ??= new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      handle(req, res).catch((error) => {
        console.error("[appsense] request failed:", error);
        if (!res.headersSent) sendJson(res, 500, { error: "Internal error" });
        else res.end();
      });
    });
    server.once("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "EADDRINUSE") {
        console.error(`[appsense] port ${PORT} in use; assuming another AppSense preview server is running.`);
        resolve(null);
      } else {
        starting = undefined;
        reject(error);
      }
    });
    server.listen(PORT, "127.0.0.1", () => {
      console.error(`[appsense] preview at http://localhost:${PORT}`);
      resolve(server);
    });
  });
  return starting;
}
