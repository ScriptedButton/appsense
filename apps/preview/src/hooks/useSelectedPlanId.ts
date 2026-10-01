import { useCallback, useEffect, useState } from "react";
import type { PlanSummary } from "@appsense/core";

const readParam = () => new URLSearchParams(window.location.search).get("plan");

/** Keeps the selected plan in the `?plan=` query param, defaulting to the newest plan. */
export function useSelectedPlanId(plans: PlanSummary[] | undefined): [string | null, (id: string) => void] {
  const [selected, setSelected] = useState<string | null>(readParam);

  const select = useCallback((id: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("plan", id);
    window.history.replaceState(null, "", url);
    setSelected(id);
  }, []);

  useEffect(() => {
    if (!plans || plans.length === 0) return;
    if (!selected || !plans.some((plan) => plan.id === selected)) select(plans[0]!.id);
  }, [plans, selected, select]);

  return [selected, select];
}
