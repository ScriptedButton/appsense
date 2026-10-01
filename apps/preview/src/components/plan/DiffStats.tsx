import type { DiffSummary } from "@appsense/core";

interface DiffStatsProps {
  summary: DiffSummary;
}

export function DiffStats({ summary }: DiffStatsProps) {
  const folders = [
    summary.foldersCreated && `${summary.foldersCreated} new`,
    summary.foldersRenamed && `${summary.foldersRenamed} renamed`,
    summary.foldersRemoved && `${summary.foldersRemoved} removed`,
  ].filter(Boolean);

  const stats = [
    { label: "Pages", value: `${summary.pagesBefore} → ${summary.pagesAfter}` },
    { label: "Apps moved", value: String(summary.moved + summary.reordered) },
    { label: "To App Library", value: String(summary.toAppLibrary) },
    { label: "Folders", value: folders.length ? folders.join(", ") : "No changes" },
  ];
  if (summary.fromAppLibrary > 0) stats.push({ label: "Added back", value: String(summary.fromAppLibrary) });

  return (
    <dl className="flex flex-wrap gap-x-8 gap-y-3 border-y border-line py-3">
      {stats.map((stat) => (
        <div key={stat.label}>
          <dt className="text-xs text-muted">{stat.label}</dt>
          <dd className="font-medium tabular-nums">{stat.value}</dd>
        </div>
      ))}
    </dl>
  );
}
