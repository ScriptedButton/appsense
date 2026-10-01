interface ErrorStateProps {
  title: string;
  message: string;
  onRetry: () => void;
}

export function ErrorState({ title, message, onRetry }: ErrorStateProps) {
  return (
    <section role="alert" className="mx-auto max-w-2xl space-y-4 px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="leading-relaxed text-muted">
        {message} Make sure the AppSense MCP server is running in Cursor, or start the preview server with{" "}
        <code className="rounded bg-surface-strong px-1.5 py-0.5 text-sm text-ink">pnpm preview</code>.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="min-h-11 rounded-full bg-primary px-5 font-medium text-white hover:bg-primary-strong active:bg-primary-strong/90"
      >
        Try again
      </button>
    </section>
  );
}
