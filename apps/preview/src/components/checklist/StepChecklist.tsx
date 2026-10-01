import type { GuideSection, GuideStep } from "@appsense/core";
import { useChecklist } from "../../hooks/useChecklist";
import { ChecklistProgress } from "./ChecklistProgress";
import { StepSection } from "./StepSection";

interface StepChecklistProps {
  planId: string;
  steps: GuideStep[];
  onShowPage: (page: number) => void;
}

function groupBySection(steps: GuideStep[]): [GuideSection, GuideStep[]][] {
  const groups: [GuideSection, GuideStep[]][] = [];
  for (const step of steps) {
    const last = groups.at(-1);
    if (last && last[0] === step.section) last[1].push(step);
    else groups.push([step.section, [step]]);
  }
  return groups;
}

export function StepChecklist({ planId, steps, onShowPage }: StepChecklistProps) {
  const { done, toggle, reset } = useChecklist(planId);
  const completed = steps.filter((step) => done.has(step.id)).length;
  let number = 0;

  return (
    <section aria-labelledby="steps-title" className="space-y-5">
      <ChecklistProgress completed={completed} total={steps.length} onReset={reset} />
      <ol className="space-y-6">
        {groupBySection(steps).map(([section, sectionSteps]) => {
          const startAt = number + 1;
          number += sectionSteps.length;
          return (
            <StepSection
              key={section}
              section={section}
              steps={sectionSteps}
              startAt={startAt}
              done={done}
              onToggle={toggle}
              onShowPage={onShowPage}
            />
          );
        })}
      </ol>
    </section>
  );
}
