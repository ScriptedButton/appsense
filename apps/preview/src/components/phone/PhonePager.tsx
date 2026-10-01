import { useRef } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import type { Layout } from "@appsense/core";
import { PhoneSideContext } from "../../context/PlanView";
import type { PhoneSide } from "../../context/PlanView";
import { Dock } from "./Dock";
import { HomePage } from "./HomePage";
import { PageDots } from "./PageDots";
import { PhoneFrame } from "./PhoneFrame";
import { PagerButton } from "./PagerButton";

interface PhonePagerProps {
  side: PhoneSide;
  title: string;
  layout: Layout;
  page: number;
  onPageChange: (page: number) => void;
}

const SWIPE_THRESHOLD_PX = 40;

/** A phone mockup that pages through home screens via dots, arrows, swipes, or arrow keys. */
export function PhonePager({ side, title, layout, page, onPageChange }: PhonePagerProps) {
  const pageCount = Math.max(layout.pages.length, 1);
  const current = Math.min(page, pageCount - 1);
  const swipeStart = useRef<number | null>(null);

  const go = (next: number) => onPageChange(Math.max(0, Math.min(pageCount - 1, next)));

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowLeft") go(current - 1);
    else if (event.key === "ArrowRight") go(current + 1);
    else return;
    event.preventDefault();
  };
  const onPointerDown = (event: PointerEvent) => {
    swipeStart.current = event.clientX;
  };
  const onPointerUp = (event: PointerEvent) => {
    if (swipeStart.current === null) return;
    const delta = event.clientX - swipeStart.current;
    swipeStart.current = null;
    if (Math.abs(delta) > SWIPE_THRESHOLD_PX) go(current + (delta < 0 ? 1 : -1));
  };

  return (
    <PhoneSideContext.Provider value={side}>
      <section aria-label={`${title} home screen`} className="flex flex-col items-center gap-3">
        <div className="flex w-full items-baseline justify-between px-1">
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="text-sm text-muted" aria-live="polite">
            Page {current + 1} of {pageCount}
          </p>
        </div>
        <div
          role="group"
          tabIndex={0}
          aria-roledescription="home screen pager"
          aria-label={`${title}: use left and right arrow keys to change page`}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          className="touch-pan-y rounded-[3.25rem] select-none"
        >
          <PhoneFrame>
            <div className="flex-1">
              <HomePage key={current} items={layout.pages[current] ?? []} />
            </div>
            <div className="space-y-3 pb-3">
              {pageCount > 1 && <PageDots count={pageCount} current={current} onSelect={go} />}
              <Dock items={layout.dock} />
            </div>
          </PhoneFrame>
        </div>
        <div className="flex gap-2">
          <PagerButton direction="previous" disabled={current === 0} onClick={() => go(current - 1)} />
          <PagerButton direction="next" disabled={current >= pageCount - 1} onClick={() => go(current + 1)} />
        </div>
      </section>
    </PhoneSideContext.Provider>
  );
}
