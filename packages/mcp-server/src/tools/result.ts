import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { DeviceError } from "../device/pymobiledevice.js";

export function text(body: string): CallToolResult {
  return { content: [{ type: "text", text: body }] };
}

export function failure(body: string): CallToolResult {
  return { content: [{ type: "text", text: body }], isError: true };
}

/** Wraps a tool handler so device problems come back as actionable messages instead of protocol errors. */
export function guarded<A>(handler: (args: A) => Promise<CallToolResult>): (args: A) => Promise<CallToolResult> {
  return async (args) => {
    try {
      return await handler(args);
    } catch (error) {
      if (error instanceof DeviceError) return failure([error.message, error.hint].filter(Boolean).join("\n"));
      return failure(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
}

export const udidParam = "Device UDID from device_status. Defaults to the first USB-connected iPhone.";
