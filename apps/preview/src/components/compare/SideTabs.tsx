import type { PhoneSide } from "../../context/PlanView";

interface SideTabsProps {
  value: PhoneSide;
  onChange: (side: PhoneSide) => void;
}

const OPTIONS: { side: PhoneSide; label: string }[] = [
  { side: "before", label: "Now" },
  { side: "after", label: "Proposed" },
];

/** Segmented control shown only when the two phones don't fit side by side. */
export function SideTabs({ value, onChange }: SideTabsProps) {
  return (
    <div role="radiogroup" aria-label="Which home screen to show" className="inline-flex rounded-full bg-surface-strong p-1 xl:hidden">
      {OPTIONS.map(({ side, label }) => (
        <button
          key={side}
          type="button"
          role="radio"
          aria-checked={value === side}
          onClick={() => onChange(side)}
          className={`min-h-9 rounded-full px-4 text-sm font-medium transition-colors duration-150 ${
            value === side ? "bg-bg text-ink shadow-sm" : "text-muted hover:text-ink"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
