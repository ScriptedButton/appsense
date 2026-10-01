interface ChangeBadgeProps {
  kind: "changed" | "leaving";
}

export function ChangeBadge({ kind }: ChangeBadgeProps) {
  if (kind === "leaving") {
    return (
      <span
        aria-hidden="true"
        className="absolute -left-1 -top-1 grid size-4 place-items-center rounded-full bg-remove text-[0.625rem] font-bold leading-none text-white ring-2 ring-white/80"
      >
        −
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className="absolute -right-0.5 -top-0.5 size-3 rounded-full bg-change ring-2 ring-white/90"
    />
  );
}
