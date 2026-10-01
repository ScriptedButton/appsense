import { fetchPlan, fetchPlans } from "./api";
import { PlanScreen } from "./components/PlanScreen";
import { AppHeader } from "./components/shell/AppHeader";
import { EmptyState } from "./components/shell/EmptyState";
import { ErrorState } from "./components/shell/ErrorState";
import { LoadingState } from "./components/shell/LoadingState";
import { PlanPicker } from "./components/shell/PlanPicker";
import { useAsync } from "./hooks/useAsync";
import { useSelectedPlanId } from "./hooks/useSelectedPlanId";

export function App() {
  const plans = useAsync(fetchPlans, []);
  const planList = plans.status === "ready" ? plans.data : undefined;
  const [selectedId, select] = useSelectedPlanId(planList);
  const plan = useAsync(selectedId ? () => fetchPlan(selectedId) : null, [selectedId]);

  return (
    <div className="min-h-dvh">
      <AppHeader>
        {planList && <PlanPicker plans={planList} selectedId={selectedId} onSelect={select} />}
      </AppHeader>
      {plans.status === "error" ? (
        <ErrorState title="Can't reach AppSense" message={`Loading plans failed (${plans.error}).`} onRetry={plans.reload} />
      ) : planList && planList.length === 0 ? (
        <EmptyState />
      ) : plan.status === "error" ? (
        <ErrorState title="Can't open this plan" message={`Loading the plan failed (${plan.error}).`} onRetry={plan.reload} />
      ) : plan.status === "ready" ? (
        <PlanScreen key={plan.data.id} plan={plan.data} />
      ) : (
        <LoadingState />
      )}
    </div>
  );
}
