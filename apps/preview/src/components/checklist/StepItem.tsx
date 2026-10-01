import type { GuideStep } from "@appsense/core";
import { pageFromStepTitle } from "../../lib/layout";
import { StepCheckbox } from "./StepCheckbox";
import { StepItemList } from "./StepItemList";

interface StepItemProps {
  step: GuideStep;
  number: number;
  done: boolean;
  onToggle: () => void;
  onShowPage: (page: number) => void;
}

export function StepItem({ step, number, done, onToggle, onShowPage }: StepItemProps) {
  const page = pageFromStepTitle(step.title);
  const inputId = `step-${step.id}`;

  return (
    <li className={`flex gap-3 p-4 transition-colors duration-200 ${done ? "bg-surface" : ""}`}>
      <StepCheckbox id={inputId} checked={done} onChange={onToggle} />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
          <label htmlFor={inputId} className="cursor-pointer font-medium">
            <span className="mr-1.5 tabular-nums text-muted">{number}.</span>
            <span className={done ? "text-muted line-through decoration-muted/60" : ""}>{step.title}</span>
          </label>
          {page !== null && (
            <button
              type="button"
              onClick={() => onShowPage(page)}
              className="-my-1 min-h-9 rounded-full px-3 text-sm font-medium text-primary hover:bg-primary-soft active:bg-primary-soft/70"
            >
              Show on phone
            </button>
          )}
        </div>
        {step.detail && !done && <p className="max-w-[68ch] text-sm leading-relaxed text-muted">{step.detail}</p>}
        {step.items && step.items.length > 0 && !done && <StepItemList items={step.items} />}
      </div>
    </li>
  );
}
