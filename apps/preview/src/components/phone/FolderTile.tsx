import { useContext, useRef } from "react";
import type { FolderItem } from "@appsense/core";
import { PhoneSideContext, usePlanView } from "../../context/PlanView";
import { folderIcons } from "../../lib/layout";
import { IconImage } from "./AppIcon";
import { ChangeBadge } from "./ChangeBadge";
import { FolderSheet } from "./FolderSheet";

interface FolderTileProps {
  folder: FolderItem;
  showLabel?: boolean;
}

export function FolderTile({ folder, showLabel = true }: FolderTileProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const side = useContext(PhoneSideContext);
  const { showChanges, changedIds } = usePlanView();
  const icons = folderIcons(folder);
  const changed = showChanges && side === "after" && icons.some((icon) => changedIds.has(icon.id));

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        aria-label={`${folder.name} folder, ${icons.length} apps${changed ? ", has changes" : ""}`}
        className="group flex min-w-0 flex-col items-center gap-1 rounded-xl focus-visible:outline-white"
      >
        <span className="relative">
          <span className="grid size-[3.25rem] grid-cols-3 content-start gap-[0.1875rem] rounded-[23%] bg-white/25 p-[0.4375rem] backdrop-blur-md transition-transform duration-200 ease-out-quart group-hover:scale-105 group-active:scale-95">
            {icons.slice(0, 9).map((icon) => (
              <IconImage key={icon.id} id={icon.id} name={icon.name} size="xs" />
            ))}
          </span>
          {changed && <ChangeBadge kind="changed" />}
        </span>
        <span
          aria-hidden="true"
          className={showLabel ? "w-full truncate text-center text-[0.6875rem] leading-tight text-white [text-shadow:0_1px_2px_rgb(0_0_0/0.5)]" : "sr-only"}
        >
          {folder.name}
        </span>
      </button>
      <FolderSheet ref={dialog} folder={folder} side={side} />
    </>
  );
}
