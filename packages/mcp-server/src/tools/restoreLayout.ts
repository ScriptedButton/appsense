import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { restoreIconState } from "../device/apply.js";
import { listBackups, loadBackup } from "../device/backups.js";
import { resolveDevice } from "../device/service.js";
import { failure, guarded, text, udidParam } from "./result.js";

export function registerRestoreLayout(server: McpServer): void {
  server.registerTool(
    "restore_layout",
    {
      title: "Restore a previous layout",
      description:
        "Undo apply_layout by writing a backed-up home screen back to the iPhone. Without backupId, lists available backups instead of restoring.",
      inputSchema: {
        backupId: z.string().optional().describe("Backup id from apply_layout or from this tool's list"),
        udid: z.string().optional().describe(udidParam),
      },
      annotations: { destructiveHint: true },
    },
    guarded(async ({ backupId, udid }) => {
      const device = await resolveDevice(udid);
      if (!backupId) {
        const backups = await listBackups(device.udid);
        if (backups.length === 0) return text(`No backups for ${device.name} yet.`);
        return text(backups.map((backup) => `- ${backup.id}: ${backup.label} (${backup.createdAt})`).join("\n"));
      }
      const backup = await loadBackup(device.udid, backupId);
      if (!backup) return failure(`No backup "${backupId}" for ${device.name}. Call restore_layout without backupId to list them.`);
      const { backup: safety, result } = await restoreIconState(device.udid, backup.state, `restore ${backupId}`);
      return text(
        `Restored ${backupId} on ${device.name}: now ${result.pages.length} page(s). The layout you just replaced was saved as ${safety.id}.`,
      );
    }),
  );
}
