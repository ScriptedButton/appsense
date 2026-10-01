import { diffLayouts } from "./diff.js";
import type { DiffSummary, LayoutDiff } from "./diff.js";
import { buildGuide } from "./guide.js";
import type { GuideStep } from "./guide.js";
import type { Catalog, Layout } from "./schema.js";
import type { Issue, ValidationResult } from "./validate.js";

export interface DeviceRef {
  udid: string;
  name: string;
}

export interface Plan {
  id: string;
  name: string;
  rationale: string;
  createdAt: string;
  device: DeviceRef;
  current: Layout;
  proposed: Layout;
  appLibrary: string[];
  catalog: Catalog;
  diff: LayoutDiff;
  steps: GuideStep[];
  warnings: Issue[];
}

export interface PlanSummary {
  id: string;
  name: string;
  createdAt: string;
  device: DeviceRef;
  summary: DiffSummary;
}

export interface CreatePlanInput {
  id: string;
  name: string;
  rationale: string;
  device: DeviceRef;
  current: Layout;
  catalog: Catalog;
  validation: ValidationResult;
  now?: Date;
}

export function createPlan(input: CreatePlanInput): Plan {
  const { current, catalog, validation } = input;
  const nameOf = (id: string) => catalog[id]?.name ?? id;
  const diff = diffLayouts(current, validation.layout, validation.appLibrary);
  return {
    id: input.id,
    name: input.name,
    rationale: input.rationale,
    createdAt: (input.now ?? new Date()).toISOString(),
    device: input.device,
    current,
    proposed: validation.layout,
    appLibrary: validation.appLibrary,
    catalog,
    diff,
    steps: buildGuide(current, validation.layout, diff, nameOf),
    warnings: validation.warnings,
  };
}

export function summarizePlan(plan: Plan): PlanSummary {
  return { id: plan.id, name: plan.name, createdAt: plan.createdAt, device: plan.device, summary: plan.diff.summary };
}
