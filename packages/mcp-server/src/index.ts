#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ensureHttpServer } from "./http/server.js";
import { registerDeviceStatus } from "./tools/deviceStatus.js";
import { registerGetApplyGuide } from "./tools/getApplyGuide.js";
import { registerGetCurrentLayout } from "./tools/getCurrentLayout.js";
import { registerListInstalledApps } from "./tools/listInstalledApps.js";
import { registerListPlans } from "./tools/listPlans.js";
import { registerOpenPreview } from "./tools/openPreview.js";
import { registerProposeLayout } from "./tools/proposeLayout.js";
import { registerApplyLayout } from "./tools/applyLayout.js";
import { registerRestoreLayout } from "./tools/restoreLayout.js";

const server = new McpServer(
  { name: "appsense", version: "0.1.0" },
  {
    instructions:
      "AppSense reads a USB-connected iPhone's home screen and turns your proposed organization into a validated plan with a visual preview, then can write it to the phone. Workflow: device_status -> get_current_layout + list_installed_apps -> propose_layout (iterate on errors) -> share the preview link -> apply_layout when the user wants it on their phone (restore_layout undoes it).",
  },
);

for (const register of [
  registerDeviceStatus,
  registerListInstalledApps,
  registerGetCurrentLayout,
  registerProposeLayout,
  registerGetApplyGuide,
  registerListPlans,
  registerOpenPreview,
  registerApplyLayout,
  registerRestoreLayout,
]) {
  register(server);
}

await server.connect(new StdioServerTransport());
void ensureHttpServer().catch((error) => console.error("[appsense] preview server failed:", error));
