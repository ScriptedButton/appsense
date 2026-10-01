import type { Plan } from "@appsense/core";
import { AppLibraryList } from "./AppLibraryList";
import { DiffStats } from "./DiffStats";
import { PlanWarnings } from "./PlanWarnings";

interface PlanOverviewProps {
  plan: Plan;
}

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

export function PlanOverview({ plan }: PlanOverviewProps) {
  return (
    <section aria-labelledby="plan-title" className="space-y-4">
      <div className="space-y-1">
        <h1 id="plan-title" className="text-2xl font-semibold tracking-tight">
          {plan.name}
        </h1>
        <p className="text-sm text-muted">
          For {plan.device.name} · {dateFormat.format(new Date(plan.createdAt))}
        </p>
      </div>
      <p className="max-w-[68ch] leading-relaxed text-pretty">{plan.rationale}</p>
      <DiffStats summary={plan.diff.summary} />
      <PlanWarnings warnings={plan.warnings} />
      <AppLibraryList plan={plan} />
    </section>
  );
}
