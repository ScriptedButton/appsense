import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { deviceStatuses } from "../device/service.js";
import { guarded, text } from "./result.js";

export function registerDeviceStatus(server: McpServer): void {
  server.registerTool(
    "device_status",
    {
      title: "Device status",
      description: "List connected iPhones and whether this Mac is trusted. Call first to confirm a device is ready.",
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    guarded(async () => {
      const devices = await deviceStatuses();
      if (devices.length === 0) {
        return text("No iPhone connected. Plug it in over USB, unlock it, and tap Trust when prompted.");
      }
      const lines = devices.map(
        (device) =>
          `- ${device.name} (${device.model}, iOS ${device.iosVersion}) udid=${device.udid} via ${device.connections.join("+")}: ${
            device.problem ?? (device.trusted ? "ready" : "not trusted")
          }`,
      );
      return text(lines.join("\n"));
    }),
  );
}
