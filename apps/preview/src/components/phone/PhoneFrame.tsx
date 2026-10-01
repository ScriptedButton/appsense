import type { ReactNode } from "react";

interface PhoneFrameProps {
  children: ReactNode;
}

/** iPhone-shaped bezel with a status bar and wallpaper. */
export function PhoneFrame({ children }: PhoneFrameProps) {
  return (
    <div className="w-[21rem] max-w-full rounded-[3.25rem] bg-ink p-2.5 shadow-[0_24px_48px_-20px_oklch(0.2_0.05_250/0.55)]">
      <div className="relative flex h-[44rem] flex-col overflow-hidden rounded-[2.75rem] bg-linear-to-b from-wallpaper-top to-wallpaper-bottom">
        <div aria-hidden="true" className="flex items-center justify-between px-8 pb-3 pt-3.5 text-sm font-semibold text-white">
          <span>9:41</span>
          <span className="h-7 w-24 rounded-full bg-black" />
          <span className="flex gap-1">
            <span className="h-3 w-5 rounded-sm border border-white/80" />
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
