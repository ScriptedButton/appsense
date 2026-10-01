import { execFile, spawn } from "node:child_process";
import type { ExecFileException } from "node:child_process";
import { access, constants, mkdir, readdir, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { delimiter, dirname, join } from "node:path";
import { REPO_ROOT } from "../paths.js";

const SET_ICON_STATE_SCRIPT = join(REPO_ROOT, "packages", "mcp-server", "scripts", "set_icon_state.py");

export class DeviceError extends Error {
  constructor(
    message: string,
    readonly hint?: string,
  ) {
    super(message);
    this.name = "DeviceError";
  }
}

/** GUI-launched processes (like Cursor's MCP host) often lack Homebrew and pipx paths. */
const EXTRA_BIN_DIRS = ["/opt/homebrew/bin", "/usr/local/bin", join(homedir(), ".local", "bin")];

let resolvedBinary: Promise<string> | undefined;

async function pythonFrameworkDirs(): Promise<string[]> {
  const root = "/Library/Frameworks/Python.framework/Versions";
  try {
    const versions = await readdir(root);
    return versions.sort().reverse().map((version) => join(root, version, "bin"));
  } catch {
    return [];
  }
}

/** Stale pip installs can leave scripts whose shebang points at a removed Python, so each candidate is probed. */
function runs(candidate: string): Promise<boolean> {
  return new Promise((resolve) => {
    execFile(candidate, ["version"], { timeout: 15_000 }, (error) => resolve(!error));
  });
}

async function findBinary(): Promise<string> {
  const override = process.env.APPSENSE_PMD_BIN;
  if (override) return override;
  const dirs = [
    ...(process.env.PATH ?? "").split(delimiter),
    ...EXTRA_BIN_DIRS,
    ...(await pythonFrameworkDirs()),
  ].filter(Boolean);
  for (const dir of new Set(dirs)) {
    const candidate = join(dir, "pymobiledevice3");
    try {
      await access(candidate, constants.X_OK);
    } catch {
      continue;
    }
    if (await runs(candidate)) return candidate;
  }
  throw new DeviceError(
    "pymobiledevice3 is not installed.",
    "Install it with `pipx install pymobiledevice3` (or set APPSENSE_PMD_BIN to its path), then retry.",
  );
}

function binary(): Promise<string> {
  resolvedBinary ??= findBinary().catch((error) => {
    resolvedBinary = undefined;
    throw error;
  });
  return resolvedBinary;
}

const KNOWN_FAILURES: { pattern: RegExp; message: string; hint: string }[] = [
  {
    pattern: /Device not found|NoDeviceConnected|No device/i,
    message: "No iPhone is connected.",
    hint: "Plug the iPhone in over USB and unlock it, then retry.",
  },
  {
    pattern: /NotPaired|PairingDialogResponsePending|UserDeniedPairing|InvalidHostID/i,
    message: "This Mac is not trusted by the iPhone.",
    hint: "Unlock the iPhone and tap Trust on the prompt, then retry.",
  },
  {
    pattern: /PasswordRequired|PasscodeProtected|DeviceLocked/i,
    message: "The iPhone is locked.",
    hint: "Unlock the iPhone and retry.",
  },
];

function describeFailure(stderr: string): DeviceError {
  for (const failure of KNOWN_FAILURES) {
    if (failure.pattern.test(stderr)) return new DeviceError(failure.message, failure.hint);
  }
  const lastLine = stderr.trim().split("\n").filter((line) => !/bad interpreter/.test(line)).pop();
  return new DeviceError(`pymobiledevice3 failed: ${lastLine ?? "unknown error"}`);
}

export interface RunOptions {
  udid?: string;
  timeoutMs?: number;
}

export async function runPmd(args: string[], options: RunOptions = {}): Promise<string> {
  const bin = await binary();
  const fullArgs = options.udid ? [...args, "--udid", options.udid] : args;
  const env = { ...process.env, PATH: [dirname(bin), ...EXTRA_BIN_DIRS, process.env.PATH ?? ""].join(delimiter) };
  return new Promise((resolve, reject) => {
    execFile(
      bin,
      fullArgs,
      { timeout: options.timeoutMs ?? 60_000, maxBuffer: 256 * 1024 * 1024, env },
      (error: ExecFileException | null, stdout: string, stderr: string) => {
        if (error) {
          if (error.code === "ENOENT") {
            resolvedBinary = undefined;
            reject(new DeviceError("pymobiledevice3 could not be started.", "Reinstall it with `pipx install pymobiledevice3`."));
          } else if (error.killed) {
            reject(new DeviceError(`pymobiledevice3 ${args.slice(0, 2).join(" ")} timed out.`, "Make sure the iPhone is unlocked and connected."));
          } else {
            reject(describeFailure(`${stderr}\n${error.message}`));
          }
          return;
        }
        resolve(stdout);
      },
    );
  });
}

async function runJson<T>(args: string[], options?: RunOptions): Promise<T> {
  const stdout = await runPmd(args, options);
  try {
    return JSON.parse(stdout) as T;
  } catch {
    throw new DeviceError(`Could not parse output of pymobiledevice3 ${args.slice(0, 3).join(" ")}.`);
  }
}

export interface UsbmuxDevice {
  UniqueDeviceID: string;
  DeviceName: string;
  ProductType: string;
  ProductVersion: string;
  ConnectionType: "USB" | "Network";
  DeviceClass: string;
}

export function listUsbmuxDevices(): Promise<UsbmuxDevice[]> {
  return runJson<UsbmuxDevice[]>(["usbmux", "list", "--no-color"], { timeoutMs: 20_000 });
}

export interface LockdownInfo {
  DeviceName?: string;
  ProductVersion?: string;
  TrustedHostAttached?: boolean;
  PasswordProtected?: boolean;
}

export function lockdownInfo(udid: string): Promise<LockdownInfo> {
  return runJson<LockdownInfo>(["lockdown", "info", "--no-color"], { udid, timeoutMs: 20_000 });
}

export function getIconState(udid: string): Promise<unknown> {
  return runJson<unknown>(["springboard", "state", "get", "--no-color"], { udid });
}

export interface RawAppInfo {
  CFBundleIdentifier?: string;
  CFBundleDisplayName?: string;
  CFBundleName?: string;
  ApplicationType?: string;
  IsAppClip?: boolean;
  SBAppTags?: string[];
}

export function listApps(udid: string, type: "User" | "System" | "Any" = "Any"): Promise<Record<string, RawAppInfo>> {
  return runJson<Record<string, RawAppInfo>>(["apps", "list", "--no-color", "-t", type], { udid, timeoutMs: 120_000 });
}

/** The Python interpreter pymobiledevice3 was installed into, read from its shebang. */
async function pythonInterpreter(): Promise<string[]> {
  const shebang = (await readFile(await binary(), "utf8")).split("\n", 1)[0] ?? "";
  if (!shebang.startsWith("#!")) throw new DeviceError("Could not find the Python interpreter for pymobiledevice3.");
  const parts = shebang.slice(2).trim().split(/\s+/);
  return parts[0]?.endsWith("/env") ? parts.slice(1) : parts;
}

/** Writes a full icon state to SpringBoard and returns the state the device reports afterwards. */
export async function setIconState(udid: string, state: unknown[]): Promise<unknown> {
  const [python, ...pythonArgs] = await pythonInterpreter();
  if (!python) throw new DeviceError("Could not find the Python interpreter for pymobiledevice3.");
  return new Promise((resolve, reject) => {
    const child = spawn(python, [...pythonArgs, SET_ICON_STATE_SCRIPT, udid], { stdio: ["pipe", "pipe", "pipe"] });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    const timer = setTimeout(() => child.kill(), 60_000);
    child.stdout.on("data", (chunk: Buffer) => stdout.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk));
    child.on("error", (error) => reject(new DeviceError(`Could not run the layout writer: ${error.message}`)));
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) return reject(describeFailure(Buffer.concat(stderr).toString()));
      try {
        resolve(JSON.parse(Buffer.concat(stdout).toString()));
      } catch {
        reject(new DeviceError("The layout was sent, but the device's response could not be read."));
      }
    });
    child.stdin.end(JSON.stringify(state));
  });
}

export async function fetchIcon(udid: string, bundleId: string, outPath: string): Promise<void> {
  await mkdir(dirname(outPath), { recursive: true });
  await runPmd(["springboard", "icon", bundleId, outPath], { udid, timeoutMs: 20_000 });
}
