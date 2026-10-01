import { forwardRef } from "react";
import type { FolderItem } from "@appsense/core";
import { PhoneSideContext } from "../../context/PlanView";
import type { PhoneSide } from "../../context/PlanView";
import { AppIcon } from "./AppIcon";

interface FolderSheetProps {
  folder: FolderItem;
  side: PhoneSide;
}

/** Native dialog listing every app in a folder, page by page. */
export const FolderSheet = forwardRef<HTMLDialogElement, FolderSheetProps>(function FolderSheet({ folder, side }, ref) {
  const close = () => (ref && "current" in ref ? ref.current?.close() : undefined);
  return (
    <dialog
      ref={ref}
      aria-label={`${folder.name} folder`}
      onClick={(event) => event.target === event.currentTarget && close()}
      className="m-auto w-[min(22rem,calc(100vw-2rem))] rounded-3xl bg-linear-to-b from-wallpaper-top to-wallpaper-bottom p-0 text-white shadow-2xl"
    >
      <div className="flex items-center justify-between px-5 pb-2 pt-4">
        <h3 className="text-lg font-semibold">{folder.name}</h3>
        <button
          type="button"
          onClick={close}
          className="min-h-11 rounded-full px-4 text-sm font-medium text-white/90 hover:bg-white/10 focus-visible:outline-white"
        >
          Close
        </button>
      </div>
      <PhoneSideContext.Provider value={side}>
        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 pb-5">
          {folder.pages.map((page, index) => (
            <section key={index} aria-label={`Folder page ${index + 1}`} className="rounded-2xl bg-white/10 p-3">
              <ul className="grid grid-cols-3 gap-x-2 gap-y-3">
                {page.map((icon) => (
                  <li key={icon.id}>
                    <AppIcon id={icon.id} name={icon.name} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </PhoneSideContext.Provider>
    </dialog>
  );
});
