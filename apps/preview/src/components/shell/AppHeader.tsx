import type { ReactNode } from "react";

interface AppHeaderProps {
  children?: ReactNode;
}

export function AppHeader({ children }: AppHeaderProps) {
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-[90rem] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <a href="/" className="flex min-h-11 items-center gap-2.5 rounded-lg font-semibold">
          <svg aria-hidden="true" viewBox="0 0 32 32" className="size-7">
            <rect width="32" height="32" rx="8" className="fill-primary" />
            <g fill="white">
              <rect x="7" y="7" width="7" height="7" rx="2" />
              <rect x="18" y="7" width="7" height="7" rx="2" />
              <rect x="7" y="18" width="7" height="7" rx="2" />
              <rect x="18" y="18" width="7" height="7" rx="2" opacity=".5" />
            </g>
          </svg>
          AppSense
        </a>
        {children}
      </div>
    </header>
  );
}
