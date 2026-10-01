import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { summarizePlan } from "@appsense/core";
import type { Plan, PlanSummary } from "@appsense/core";
import { PLANS_DIR } from "../paths.js";

const PLAN_ID = /^[a-z0-9-]+$/;

export function isPlanId(id: string): boolean {
  return PLAN_ID.test(id);
}

export function newPlanId(name: string, now = new Date()): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const stamp = now.toISOString().slice(0, 19).replace(/[-:T]/g, "");
  return [stamp, slug || "plan"].join("-");
}

export async function savePlan(plan: Plan): Promise<void> {
  await mkdir(PLANS_DIR, { recursive: true });
  await writeFile(join(PLANS_DIR, `${plan.id}.json`), JSON.stringify(plan, null, 2));
}

export async function loadPlan(id: string): Promise<Plan | null> {
  if (!isPlanId(id)) return null;
  try {
    return JSON.parse(await readFile(join(PLANS_DIR, `${id}.json`), "utf8")) as Plan;
  } catch {
    return null;
  }
}

export async function listPlans(): Promise<PlanSummary[]> {
  let files: string[];
  try {
    files = await readdir(PLANS_DIR);
  } catch {
    return [];
  }
  const plans = await Promise.all(
    files.filter((file) => file.endsWith(".json")).map((file) => loadPlan(file.slice(0, -".json".length))),
  );
  return plans
    .filter((plan): plan is Plan => plan !== null)
    .map(summarizePlan)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function latestPlanId(): Promise<string | undefined> {
  return (await listPlans())[0]?.id;
}
