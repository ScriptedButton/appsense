interface StepCheckboxProps {
  id: string;
  checked: boolean;
  onChange: () => void;
}

/** Native checkbox with a larger, custom-drawn hit area. */
export function StepCheckbox({ id, checked, onChange }: StepCheckboxProps) {
  return (
    <span className="relative -m-2 grid size-11 shrink-0 place-items-center">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="peer absolute inset-0 cursor-pointer opacity-0"
      />
      <span
        aria-hidden="true"
        className="grid size-6 place-items-center rounded-full border-2 border-line bg-bg transition-colors duration-150 peer-hover:border-primary peer-checked:border-success peer-checked:bg-success peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary"
      >
        <svg viewBox="0 0 16 16" className={`size-3.5 text-white ${checked ? "opacity-100" : "opacity-0"}`}>
          <path d="m3.5 8.5 3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </span>
  );
}
