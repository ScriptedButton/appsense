import { createContext, useContext } from "react";

export interface PlanViewValue {
  udid: string;
  showChanges: boolean;
  /** Icons/widgets that land somewhere new in the proposed layout. */
  changedIds: ReadonlySet<string>;
  /** Icons that leave the home screen for the App Library. */
  leavingIds: ReadonlySet<string>;
}

const PlanViewContext = createContext<PlanViewValue | null>(null);

export const PlanViewProvider = PlanViewContext.Provider;

export function usePlanView(): PlanViewValue {
  const value = useContext(PlanViewContext);
  if (!value) throw new Error("usePlanView must be used inside PlanViewProvider");
  return value;
}

export type PhoneSide = "before" | "after";

export const PhoneSideContext = createContext<PhoneSide>("after");
