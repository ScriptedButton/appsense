/** Skeleton matching the plan screen so the layout doesn't jump when data arrives. */
export function LoadingState() {
  return (
    <div aria-busy="true" aria-label="Loading plan" className="mx-auto grid max-w-[90rem] gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,32rem)]">
      <div className="flex justify-center gap-8">
        <div className="h-[46.5rem] w-[21rem] max-w-full animate-pulse rounded-[3.25rem] bg-surface-strong" />
        <div className="hidden h-[46.5rem] w-[21rem] animate-pulse rounded-[3.25rem] bg-surface-strong xl:block" />
      </div>
      <div className="space-y-4">
        <div className="h-8 w-2/3 animate-pulse rounded-lg bg-surface-strong" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-surface-strong" />
        <div className="h-20 animate-pulse rounded-xl bg-surface-strong" />
        <div className="h-64 animate-pulse rounded-2xl bg-surface-strong" />
      </div>
    </div>
  );
}
