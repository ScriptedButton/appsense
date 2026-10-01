import type { Plan, PlanSummary } from "@appsense/core";

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return (await response.json()) as T;
}

export const fetchPlans = () => getJson<PlanSummary[]>("/api/plans");

export const fetchPlan = (id: string) => getJson<Plan>(`/api/plans/${encodeURIComponent(id)}`);

export const iconUrl = (udid: string, bundleId: string) =>
  `/api/icons/${encodeURIComponent(udid)}/${encodeURIComponent(bundleId)}`;
