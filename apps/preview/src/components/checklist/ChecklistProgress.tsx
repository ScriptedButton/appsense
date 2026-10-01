interface ChecklistProgressProps {
  completed: number;
  total: number;
  onReset: () => void;
}

export function ChecklistProgress({ completed, total, onReset }: ChecklistProgressProps) {
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  const finished = total > 0 && completed === total;

  return (
    <div className="sticky top-0 z-10 -mx-1 space-y-2 bg-bg/95 px-1 pb-3 pt-1 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 id="steps-title" className="text-lg font-semibold">
          {finished ? "All done" : "Steps on your iPhone"}
        </h2>
        <div className="flex items-center gap-2 text-sm">
          <span className="tabular-nums text-muted" aria-live="polite">
            {completed} of {total}
          </span>
          {completed > 0 && (
            <button
              type="button"
              onClick={onReset}
              className="min-h-9 rounded-full px-3 font-medium text-primary hover:bg-primary-soft active:bg-primary-soft/70"
            >
              Reset
            </button>
          )}
        </div>
      </div>
      <div
        role="progressbar"
        aria-label="Checklist progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="h-1.5 overflow-hidden rounded-full bg-surface-strong"
      >
        <div
          className={`h-full rounded-full transition-[width] duration-300 ease-out-quart ${finished ? "bg-success" : "bg-primary"}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
