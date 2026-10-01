import { useState } from "react";
import type { Plan } from "@appsense/core";
import type { PhoneSide } from "../../context/PlanView";
import { PhonePager } from "../phone/PhonePager";
import { ShowChangesToggle } from "./ShowChangesToggle";
import { SideTabs } from "./SideTabs";

interface BeforeAfterViewProps {
  plan: Plan;
  afterPage: number;
  onAfterPageChange: (page: number) => void;
  showChanges: boolean;
  onShowChangesChange: (value: boolean) => void;
}

/** Side by side on wide screens; a Before/After toggle on narrow ones. */
export function BeforeAfterView({ plan, afterPage, onAfterPageChange, showChanges, onShowChangesChange }: BeforeAfterViewProps) {
  const [beforePage, setBeforePage] = useState(0);
  const [mobileSide, setMobileSide] = useState<PhoneSide>("after");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SideTabs value={mobileSide} onChange={setMobileSide} />
        <ShowChangesToggle checked={showChanges} onChange={onShowChangesChange} />
      </div>
      <div className="flex flex-wrap justify-center gap-8">
        <div className={mobileSide === "before" ? "block" : "hidden xl:block"}>
          <PhonePager side="before" title="Now" layout={plan.current} page={beforePage} onPageChange={setBeforePage} />
        </div>
        <div className={mobileSide === "after" ? "block" : "hidden xl:block"}>
          <PhonePager side="after" title="Proposed" layout={plan.proposed} page={afterPage} onPageChange={onAfterPageChange} />
        </div>
      </div>
    </div>
  );
}
