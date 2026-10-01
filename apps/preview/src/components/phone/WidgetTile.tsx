import { useContext } from "react";
import type { WidgetItem } from "@appsense/core";
import { PhoneSideContext, usePlanView } from "../../context/PlanView";
import { WIDGET_SPAN } from "../../lib/layout";
import { IconImage } from "./AppIcon";
import { ChangeBadge } from "./ChangeBadge";

interface WidgetTileProps {
  widget: WidgetItem;
}

export function WidgetTile({ widget }: WidgetTileProps) {
  const side = useContext(PhoneSideContext);
  const { showChanges, changedIds } = usePlanView();
  const changed = showChanges && side === "after" && changedIds.has(widget.id);

  return (
    <li className={`${WIDGET_SPAN[widget.size]} relative`}>
      <div className="flex h-full flex-col justify-between rounded-[1.375rem] bg-white/20 p-3 text-white backdrop-blur-md">
        {widget.containerId ? (
          <IconImage id={widget.containerId} name={widget.name} size="sm" />
        ) : (
          <span aria-hidden="true" className="size-10 rounded-[23%] bg-white/25" />
        )}
        <span className="text-xs font-medium leading-tight">
          {widget.name}
          <span className="block text-[0.6875rem] font-normal text-white/80">{widget.size} widget</span>
        </span>
      </div>
      {changed && <ChangeBadge kind="changed" />}
    </li>
  );
}
