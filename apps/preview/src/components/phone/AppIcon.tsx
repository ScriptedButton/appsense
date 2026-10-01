import { useContext, useState } from "react";
import { iconUrl } from "../../api";
import { PhoneSideContext, usePlanView } from "../../context/PlanView";
import { hueFor, initials } from "../../lib/layout";
import { ChangeBadge } from "./ChangeBadge";

interface AppIconProps {
  id: string;
  name: string;
  size?: "md" | "sm" | "xs";
  showLabel?: boolean;
}

const SIZES = {
  md: "size-[3.25rem] text-sm",
  sm: "size-10 text-xs",
  xs: "size-[0.875rem] text-[0.4rem]",
};

export function IconImage({ id, name, size = "md" }: Omit<AppIconProps, "showLabel">) {
  const { udid } = usePlanView();
  const [failed, setFailed] = useState(false);
  const shape = `${SIZES[size]} shrink-0 rounded-[23%] overflow-hidden`;

  if (failed) {
    return (
      <span
        aria-hidden="true"
        className={`${shape} grid place-items-center font-semibold text-white`}
        style={{ background: `oklch(0.6 0.12 ${hueFor(id)})` }}
      >
        {size === "xs" ? "" : initials(name)}
      </span>
    );
  }
  return (
    <img
      src={iconUrl(udid, id)}
      alt=""
      loading="lazy"
      decoding="async"
      draggable={false}
      onError={() => setFailed(true)}
      className={`${shape} bg-white/20 object-cover`}
    />
  );
}

/** A home screen icon with an optional label and a change marker. */
export function AppIcon({ id, name, size = "md", showLabel = true }: AppIconProps) {
  const side = useContext(PhoneSideContext);
  const { showChanges, changedIds, leavingIds } = usePlanView();
  const leaving = showChanges && side === "before" && leavingIds.has(id);
  const changed = showChanges && side === "after" && changedIds.has(id);

  return (
    <div className={`flex min-w-0 flex-col items-center gap-1 transition-opacity duration-200 ${leaving ? "opacity-40" : ""}`}>
      <span className="relative">
        <IconImage id={id} name={name} size={size} />
        {changed && <ChangeBadge kind="changed" />}
        {leaving && <ChangeBadge kind="leaving" />}
      </span>
      <span className={showLabel ? "w-full truncate text-center text-[0.6875rem] leading-tight text-white [text-shadow:0_1px_2px_rgb(0_0_0/0.5)]" : "sr-only"}>
        {name}
        {changed && <span className="sr-only"> (moves here)</span>}
        {leaving && <span className="sr-only"> (goes to App Library)</span>}
      </span>
    </div>
  );
}
