interface PagerButtonProps {
  direction: "previous" | "next";
  disabled: boolean;
  onClick: () => void;
}

export function PagerButton({ direction, disabled, onClick }: PagerButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "previous" ? "Previous page" : "Next page"}
      className="grid size-11 place-items-center rounded-full border border-line bg-bg text-ink transition-colors duration-150 hover:bg-surface-strong active:bg-line disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-bg"
    >
      <svg aria-hidden="true" viewBox="0 0 20 20" className={`size-5 ${direction === "next" ? "" : "rotate-180"}`}>
        <path d="M7.5 4.5 13 10l-5.5 5.5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
