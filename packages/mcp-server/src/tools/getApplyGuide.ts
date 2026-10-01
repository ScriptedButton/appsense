import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { guideToMarkdown } from "@appsense/core";
import { z } from "zod";
import { PREVIEW_URL } from "../paths.js";
import { latestPlanId, loadPlan } from "../plans/store.js";
import { failure, guarded, text } from "./result.js";

export function registerGetApplyGuide(server: McpServer): void {
  server.registerTool(
    "get_apply_guide",
    {
      title: "Get apply guide",
      description: "Return the ordered manual steps for applying a saved plan on the iPhone, as markdown.",
      inputSchema: {
        planId: z.string().optional().describe("Plan id from propose_layout or list_plans. Defaults to the latest plan."),
      },
      annotations: { readOnlyHint: true },
    },
    guarded(async ({ planId }) => {
      const id = planId ?? (await latestPlanId());
      const plan = id ? await loadPlan(id) : null;
      if (!plan) return failure(id ? `No plan with id "${id}". Call list_plans.` : "No plans yet. Call propose_layout first.");
      return text(
        [
          `# ${plan.name}`,
          plan.rationale,
          `Interactive checklist: ${PREVIEW_URL}/?plan=${plan.id}`,
          "",
          guideToMarkdown(plan.steps),
        ].join("\n"),
      );
    }),
  );
}
