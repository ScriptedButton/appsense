import type { Issue } from "@appsense/core";

interface PlanWarningsProps {
  warnings: Issue[];
}

export function PlanWarnings({ warnings }: PlanWarningsProps) {
  if (warnings.length === 0) return null;
  return (
    <div role="note" className="rounded-xl bg-change/15 px-4 py-3 text-sm">
      <p className="font-medium text-change-ink">Heads up</p>
      <ul className="mt-1 list-disc space-y-1 pl-5">
        {warnings.map((warning) => (
          <li key={warning.code + warning.message}>{warning.message}</li>
        ))}
      </ul>
    </div>
  );
}
