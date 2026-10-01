import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { applyLayout } from "../device/apply.js";
import { resolveDevice } from "../device/service.js";
import { latestPlanId, loadPlan } from "../plans/store.js";
import { failure, guarded, text } from "./result.js";

const MAX_LISTED = 30;

export function registerApplyLayout(server: McpServer): void {
  server.registerTool(
    "apply_layout",
    {
      title: "Apply layout to iPhone",
      description:
        "Write a saved plan's layout directly to the connected iPhone's home screen. The current layout is backed up first and can be undone with restore_layout. Only call when the user has asked for the change to be made on their phone.",
      inputSchema: {
        planId: z.string().optional().describe("Plan id. Defaults to the latest plan."),
      },
      annotations: { destructiveHint: true },
    },
    guarded(async ({ planId }) => {
      const id = planId ?? (await latestPlanId());
      const plan = id ? await loadPlan(id) : null;
      if (!plan) return failure("No matching plan. Call propose_layout first.");
      const device = await resolveDevice(plan.device.udid);

      const { backup, result, misplaced, kept } = await applyLayout(device.udid, plan.proposed, plan.name);
      const nameOf = (appId: string) => plan.catalog[appId]?.name ?? appId;
      const list = (ids: string[]) =>
        ids.slice(0, MAX_LISTED).map(nameOf).join(", ") + (ids.length > MAX_LISTED ? `, and ${ids.length - MAX_LISTED} more` : "");

      const lines = [
        `Applied "${plan.name}" to ${device.name}: now ${result.pages.length} page(s).`,
        `Backup of the previous layout: ${backup.id} (undo with restore_layout).`,
      ];
      if (misplaced.length === 0 && kept.length === 0) lines.push("Verified: the home screen matches the plan exactly.");
      if (misplaced.length > 0) lines.push(`${misplaced.length} icon(s) landed somewhere other than planned: ${list(misplaced)}.`);
      const extraPages = result.pages.length - plan.proposed.pages.length;
      if (kept.length > 0 && extraPages > 0) {
        const first = plan.proposed.pages.length + 1;
        const range = extraPages === 1 ? `page ${first}` : `pages ${first}-${result.pages.length}`;
        lines.push(
          `iOS can't send apps to the App Library remotely, so it put the ${kept.length} App Library apps on ${range}.`,
          `One step left for the user: long-press the home screen, tap the page dots, uncheck ${range}, and tap Done. Those apps then live only in the App Library.`,
        );
      } else if (kept.length > 0) {
        lines.push(`${kept.length} icon(s) the plan sent to the App Library are still on the home screen: ${list(kept)}.`);
      }
      return text(lines.join("\n"));
    }),
  );
}
