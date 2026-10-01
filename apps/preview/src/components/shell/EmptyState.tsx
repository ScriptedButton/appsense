const PROMPTS = [
  "Organize my iPhone home screen so I can find things faster",
  "Put my most-used apps within thumb reach and fit everything on two pages",
  "Group my apps into folders by what I use them for",
];

/** Shown before any plan exists; explains how to create one from Cursor. */
export function EmptyState() {
  return (
    <section className="mx-auto max-w-2xl space-y-6 px-4 py-16 sm:px-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">No layout plans yet</h1>
        <p className="leading-relaxed text-muted">
          Plug your iPhone into this Mac, unlock it, and tap Trust. Then ask Cursor's agent to organize your home screen.
          Plans it proposes show up here with a side-by-side preview and a checklist to follow.
        </p>
      </div>
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted">Try asking</h2>
        <ul className="space-y-2">
          {PROMPTS.map((prompt) => (
            <li key={prompt} className="rounded-xl bg-surface px-4 py-3 font-medium">
              “{prompt}”
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
