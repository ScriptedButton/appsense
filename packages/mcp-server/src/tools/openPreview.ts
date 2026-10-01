import { execFile } from "node:child_process";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ensureHttpServer } from "../http/server.js";
import { PREVIEW_URL } from "../paths.js";
import { latestPlanId, loadPlan } from "../plans/store.js";
import { failure, guarded, text } from "./result.js";

const OPENERS: Record<string, string> = { darwin: "open", win32: "explorer", linux: "xdg-open" };

export function registerOpenPreview(server: McpServer): void {
  server.registerTool(
    "open_preview",
    {
      title: "Open preview",
      description: "Open the visual before/after preview and checklist for a plan in the default browser.",
      inputSchema: {
        planId: z.string().optional().describe("Plan id. Defaults to the latest plan."),
      },
    },
    guarded(async ({ planId }) => {
      const id = planId ?? (await latestPlanId());
      if (!id || !(await loadPlan(id))) return failure("No matching plan. Call list_plans or propose_layout.");
      await ensureHttpServer();
      const url = `${PREVIEW_URL}/?plan=${id}`;
      const opener = OPENERS[process.platform];
      if (opener) execFile(opener, [url], () => undefined);
      return text(`Opened ${url}`);
    }),
  );
}
