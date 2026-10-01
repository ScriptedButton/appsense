import { useMemo, useState } from "react";
import type { Plan } from "@appsense/core";
import { PlanViewProvider } from "../context/PlanView";
import { StepChecklist } from "./checklist/StepChecklist";
import { BeforeAfterView } from "./compare/BeforeAfterView";
import { PlanOverview } from "./plan/PlanOverview";

interface PlanScreenProps {
  plan: Plan;
}

export function PlanScreen({ plan }: PlanScreenProps) {
  const [afterPage, setAfterPage] = useState(0);
  const [showChanges, setShowChanges] = useState(true);

  const view = useMemo(
    () => ({
      udid: plan.device.udid,
      showChanges,
      changedIds: new Set(plan.diff.changedIds),
      leavingIds: new Set(plan.diff.toAppLibrary),
    }),
    [plan, showChanges],
  );

  const showPage = (page: number) => {
    setAfterPage(page);
    document.getElementById("phones")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <PlanViewProvider value={view}>
      <main className="mx-auto grid max-w-[90rem] gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,32rem)]">
        <div className="lg:order-2">
          <PlanOverview plan={plan} />
        </div>
        <div id="phones" className="scroll-mt-4 lg:sticky lg:top-6 lg:order-1 lg:row-span-2 lg:self-start">
          <BeforeAfterView
            plan={plan}
            afterPage={afterPage}
            onAfterPageChange={setAfterPage}
            showChanges={showChanges}
            onShowChangesChange={setShowChanges}
          />
        </div>
        <div className="lg:order-3">
          <StepChecklist planId={plan.id} steps={plan.steps} onShowPage={showPage} />
        </div>
      </main>
    </PlanViewProvider>
  );
}
