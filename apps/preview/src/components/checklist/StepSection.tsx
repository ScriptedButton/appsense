import type { GuideSection, GuideStep } from "@appsense/core";
import { SECTION_LABELS } from "../../lib/layout";
import { StepItem } from "./StepItem";

interface StepSectionProps {
  section: GuideSection;
  steps: GuideStep[];
  startAt: number;
  done: ReadonlySet<string>;
  onToggle: (stepId: string) => void;
  onShowPage: (page: number) => void;
}

export function StepSection({ section, steps, startAt, done, onToggle, onShowPage }: StepSectionProps) {
  const headingId = `section-${section}`;
  return (
    <li aria-labelledby={headingId} className="space-y-2">
      <h3 id={headingId} className="text-sm font-semibold text-muted">
        {SECTION_LABELS[section]}
      </h3>
      <ol className="divide-y divide-line rounded-2xl border border-line">
        {steps.map((step, index) => (
          <StepItem
            key={step.id}
            step={step}
            number={startAt + index}
            done={done.has(step.id)}
            onToggle={() => onToggle(step.id)}
            onShowPage={onShowPage}
          />
        ))}
      </ol>
    </li>
  );
}
