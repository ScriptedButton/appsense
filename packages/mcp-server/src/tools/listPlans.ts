import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { listPlans } from "../plans/store.js";
import { guarded, text } from "./result.js";

export function registerListPlans(server: McpServer): void {
  server.registerTool(
    "list_plans",
    {
      title: "List plans",
      description: "List saved layout plans, newest first.",
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    guarded(async () => {
      const plans = await listPlans();
      if (plans.length === 0) return text("No plans yet. Call propose_layout to create one.");
      return text(
        plans
          .map(
            (plan) =>
              `- ${plan.id}: "${plan.name}" for ${plan.device.name}, ${plan.createdAt} (${plan.summary.pagesBefore} -> ${plan.summary.pagesAfter} pages, ${plan.summary.moved} moved, ${plan.summary.toAppLibrary} to App Library)`,
          )
          .join("\n"),
      );
    }),
  );
}
