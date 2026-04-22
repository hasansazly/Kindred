import type { IRLActivitySuggestionCard } from '@/lib/irl/activitySuggestions';

export default function IRLActivitySuggestion({ suggestion }: { suggestion: IRLActivitySuggestionCard }) {
  return (
    <article className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-4">
      <p className="text-[11px] uppercase tracking-[0.06em] text-emerald-200">Suggested date vibe</p>
      <h4 className="mt-1 text-sm font-semibold text-slate-100">{suggestion.title}</h4>
      <p className="mt-1 text-sm text-slate-300">{suggestion.summary}</p>
      <ul className="mt-3 space-y-1.5 text-xs text-slate-300">
        {suggestion.ideas.map(idea => (
          <li key={idea} className="rounded-lg border border-slate-700/70 bg-slate-800/70 px-2.5 py-1.5">
            {idea}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] text-slate-400">Category: {suggestion.category}</p>
    </article>
  );
}
