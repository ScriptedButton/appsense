import { useState } from "react";
import type { GuideItem } from "@appsense/core";
import { IconImage } from "../phone/AppIcon";

interface StepItemListProps {
  items: GuideItem[];
}

const COLLAPSED_COUNT = 8;

export function StepItemList({ items }: StepItemListProps) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, COLLAPSED_COUNT);
  const hidden = items.length - visible.length;

  return (
    <div className="space-y-2">
      <ul className="grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
        {visible.map((item, index) => (
          <li key={`${item.id}-${index}`} className="flex min-w-0 items-center gap-2 text-sm">
            {item.id.startsWith("folder:") ? (
              <span aria-hidden="true" className="size-10 shrink-0 rounded-[23%] bg-surface-strong" />
            ) : (
              <IconImage id={item.id} name={item.name} size="sm" />
            )}
            <span className="min-w-0">
              <span className="block truncate">{item.name}</span>
              {item.note && <span className="block truncate text-xs text-muted">{item.note}</span>}
            </span>
          </li>
        ))}
      </ul>
      {items.length > COLLAPSED_COUNT && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          className="min-h-9 rounded-full px-3 text-sm font-medium text-primary hover:bg-primary-soft active:bg-primary-soft/70"
        >
          {expanded ? "Show fewer" : `Show ${hidden} more`}
        </button>
      )}
    </div>
  );
}
