import type { PlanSummary } from "@appsense/core";

interface PlanPickerProps {
  plans: PlanSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const dateFormat = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export function PlanPicker({ plans, selectedId, onSelect }: PlanPickerProps) {
  if (plans.length === 0) return null;
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted">Plan</span>
      <select
        value={selectedId ?? ""}
        onChange={(event) => onSelect(event.target.value)}
        className="min-h-11 max-w-[min(24rem,70vw)] rounded-xl border border-line bg-bg px-3 font-medium hover:border-muted/50"
      >
        {plans.map((plan) => (
          <option key={plan.id} value={plan.id}>
            {plan.name} · {dateFormat.format(new Date(plan.createdAt))}
          </option>
        ))}
      </select>
    </label>
  );
}
