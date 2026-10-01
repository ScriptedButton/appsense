import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createPlan, LayoutSpecSchema, locateIcons, validateSpec } from "@appsense/core";
import { z } from "zod";
import { getSnapshot, prefetchIcons } from "../device/service.js";
import { ensureHttpServer } from "../http/server.js";
import { PREVIEW_URL } from "../paths.js";
import { newPlanId, savePlan } from "../plans/store.js";
import { formatIssues, formatSummary } from "./format.js";
import { failure, guarded, text, udidParam } from "./result.js";

export function registerProposeLayout(server: McpServer): void {
  server.registerTool(
    "propose_layout",
    {
      title: "Propose a layout",
      description: [
        "Validate a proposed home screen layout and save it as a plan with a visual preview and step-by-step guide.",
        "Layout format: strings are bundle ids; folders are {folder, apps}; existing widgets are {widget: id}.",
        "Limits: dock 4 items (no widgets), pages 24 slots (small widget 4, medium 8, large 16), 15 pages, folders need 2+ apps.",
        "Every app currently on the home screen must be placed or listed in appLibrary, unless sendUnlistedToAppLibrary is true.",
        "If validation fails nothing is saved: fix the reported errors and call again.",
      ].join(" "),
      inputSchema: {
        name: z.string().min(1).describe('Short plan name, e.g. "Productivity focus"'),
        rationale: z.string().min(1).describe("Why this organization works for the user; shown in the preview"),
        layout: LayoutSpecSchema,
        sendUnlistedToAppLibrary: z
          .boolean()
          .optional()
          .describe("Remove every home screen app not mentioned in the layout to the App Library"),
        udid: z.string().optional().describe(udidParam),
      },
    },
    guarded(async ({ name, rationale, layout, sendUnlistedToAppLibrary, udid }) => {
      const snapshot = await getSnapshot(udid);
      const validation = validateSpec(layout, {
        current: snapshot.layout,
        catalog: snapshot.catalog,
        sendUnlistedToAppLibrary,
      });
      if (!validation.ok) {
        return failure(
          [
            "Layout is invalid; nothing was saved. Fix these and call propose_layout again.",
            formatIssues("Errors", validation.errors),
            formatIssues("Warnings", validation.warnings),
          ]
            .filter(Boolean)
            .join("\n\n"),
        );
      }

      const plan = createPlan({
        id: newPlanId(name),
        name,
        rationale,
        device: snapshot.device,
        current: snapshot.layout,
        catalog: snapshot.catalog,
        validation,
      });
      await savePlan(plan);
      await ensureHttpServer();
      prefetchIcons(snapshot.device.udid, [...locateIcons(plan.proposed).keys(), ...locateIcons(plan.current).keys()]);

      return text(
        [
          `Saved plan "${plan.name}" (id ${plan.id}) with ${plan.steps.length} steps.`,
          `Preview: ${PREVIEW_URL}/?plan=${plan.id}`,
          "",
          formatSummary(plan.diff.summary),
          formatIssues("Warnings", plan.warnings),
          "",
          "Next: share the preview link with the user, or call get_apply_guide for the text steps.",
        ]
          .filter((line) => line !== undefined)
          .join("\n"),
      );
    }),
  );
}
