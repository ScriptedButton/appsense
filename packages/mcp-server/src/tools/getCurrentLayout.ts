import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { layoutToSpec, locateIcons, widgetsOf } from "@appsense/core";
import { z } from "zod";
import { getSnapshot, prefetchIcons } from "../device/service.js";
import { readableLayout } from "./format.js";
import { guarded, text, udidParam } from "./result.js";

export function registerGetCurrentLayout(server: McpServer): void {
  server.registerTool(
    "get_current_layout",
    {
      title: "Get current home screen",
      description:
        "Read the iPhone's current home screen: a readable page-by-page view plus the same layout in the compact spec format accepted by propose_layout.",
      inputSchema: {
        refresh: z.boolean().optional().describe("Re-read the device instead of using the 2 minute cache"),
        udid: z.string().optional().describe(udidParam),
      },
      annotations: { readOnlyHint: true },
    },
    guarded(async ({ refresh, udid }) => {
      const { device, layout } = await getSnapshot(udid, { refresh });
      prefetchIcons(device.udid, [...locateIcons(layout).keys()]);
      const widgets = [...widgetsOf(layout).values()].map(({ widget, page }) => ({
        id: widget.id,
        name: widget.name,
        size: widget.size,
        page: page + 1,
      }));
      return text(
        [
          `Device: ${device.name} (udid ${device.udid})`,
          `${layout.pages.length} pages, ${locateIcons(layout).size} icons, ${widgets.length} widgets.`,
          "",
          "# Readable layout",
          readableLayout(layout),
          "",
          "# Widgets (reference by id as {\"widget\": id})",
          JSON.stringify(widgets),
          "",
          "# Spec (propose_layout format)",
          JSON.stringify(layoutToSpec(layout)),
        ].join("\n"),
      );
    }),
  );
}
