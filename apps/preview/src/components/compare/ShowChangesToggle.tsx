interface ShowChangesToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
}

export function ShowChangesToggle({ checked, onChange }: ShowChangesToggleProps) {
  return (
    <label className="inline-flex min-h-11 cursor-pointer items-center gap-3 text-sm">
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className="relative h-6 w-10 rounded-full bg-line transition-colors duration-200 peer-checked:bg-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform after:duration-200 after:ease-out-quart peer-checked:after:translate-x-4"
      />
      <span>Highlight changes</span>
      <span className="hidden items-center gap-3 text-muted sm:inline-flex" aria-hidden="true">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-change" /> moves
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-remove" /> leaves
        </span>
      </span>
    </label>
  );
}
