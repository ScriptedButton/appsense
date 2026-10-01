import type { Plan } from "@appsense/core";
import { IconImage } from "../phone/AppIcon";

interface AppLibraryListProps {
  plan: Plan;
}

export function AppLibraryList({ plan }: AppLibraryListProps) {
  const ids = plan.diff.toAppLibrary;
  if (ids.length === 0) return null;
  const apps = ids
    .map((id) => ({ id, name: plan.catalog[id]?.name ?? id }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <details className="group rounded-xl border border-line">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-medium [&::-webkit-details-marker]:hidden">
        <span>
          {apps.length} {apps.length === 1 ? "app goes" : "apps go"} to the App Library
        </span>
        <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4 text-muted transition-transform duration-200 group-open:rotate-180">
          <path d="m5 8 5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      </summary>
      <p className="px-4 text-sm text-muted">They stay installed and searchable, just off your home screen.</p>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-2 p-4">
        {apps.map((app) => (
          <li key={app.id} className="flex min-w-0 items-center gap-2 text-sm">
            <IconImage id={app.id} name={app.name} size="sm" />
            <span className="truncate">{app.name}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
