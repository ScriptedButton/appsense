import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getSnapshot } from "../device/service.js";
import { appTable } from "./format.js";
import { guarded, text, udidParam } from "./result.js";

export function registerListInstalledApps(server: McpServer): void {
  server.registerTool(
    "list_installed_apps",
    {
      title: "List installed apps",
      description:
        "List installed apps grouped by App Store genre, with bundle id and current location (Dock, Page N, folder, or App Library). Use the bundle ids when calling propose_layout.",
      inputSchema: {
        onlyHomeScreen: z.boolean().optional().describe("Only include apps currently on the home screen"),
        refresh: z.boolean().optional().describe("Re-read the device instead of using the 2 minute cache"),
        udid: z.string().optional().describe(udidParam),
      },
      annotations: { readOnlyHint: true },
    },
    guarded(async ({ onlyHomeScreen, refresh, udid }) => {
      const snapshot = await getSnapshot(udid, { refresh });
      const count = Object.keys(snapshot.catalog).length;
      return text(
        `${snapshot.device.name}: ${count} apps\n\n${appTable(snapshot.layout, snapshot.catalog, { onlyHomeScreen })}`,
      );
    }),
  );
}
