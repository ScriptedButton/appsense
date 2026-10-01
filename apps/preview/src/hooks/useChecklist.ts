import { useCallback, useEffect, useState } from "react";

const storageKey = (planId: string) => `appsense:checklist:${planId}`;

function load(planId: string): Set<string> {
  try {
    const raw = localStorage.getItem(storageKey(planId));
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

/** Completed step ids for a plan, persisted in localStorage. */
export function useChecklist(planId: string) {
  const [done, setDone] = useState<Set<string>>(() => load(planId));

  useEffect(() => setDone(load(planId)), [planId]);

  const persist = useCallback(
    (next: Set<string>) => {
      setDone(next);
      localStorage.setItem(storageKey(planId), JSON.stringify([...next]));
    },
    [planId],
  );

  const toggle = useCallback(
    (stepId: string) => {
      const next = new Set(done);
      if (next.has(stepId)) next.delete(stepId);
      else next.add(stepId);
      persist(next);
    },
    [done, persist],
  );

  const reset = useCallback(() => persist(new Set()), [persist]);

  return { done, toggle, reset };
}
