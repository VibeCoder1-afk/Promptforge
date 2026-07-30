import { Link } from "react-router-dom";
import { Star, GitFork } from "lucide-react";
import { Prompt } from "../lib/api";

export function PromptCard({
  prompt,
  onToggleFavorite,
  isFavorited,
  footer,
}: {
  prompt: Prompt;
  onToggleFavorite?: () => void;
  isFavorited?: boolean;
  footer?: React.ReactNode;
}) {
  return (
    <div className="card p-4 flex flex-col gap-3 hover:border-signal/50 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <Link to={`/prompt/${prompt._id}`} className="font-medium hover:text-signal-soft line-clamp-1">
          {prompt.title}
        </Link>
        {onToggleFavorite && (
          <button onClick={onToggleFavorite} className={isFavorited ? "text-amber" : "text-ink-500 hover:text-amber"}>
            <Star size={16} fill={isFavorited ? "currentColor" : "none"} />
          </button>
        )}
      </div>
      <p className="text-sm text-ink-500 line-clamp-2">{prompt.description || "No description yet."}</p>
      <div className="flex flex-wrap gap-1">
        {prompt.tags?.slice(0, 3).map((t) => (
          <span key={t} className="pill bg-base-700 text-ink-300">
            {t}
          </span>
        ))}
      </div>
      {prompt.forkCount > 0 && (
        <div className="flex items-center gap-1 text-xs text-ink-500">
          <GitFork size={12} /> {prompt.forkCount} forks
        </div>
      )}
      {footer}
    </div>
  );
}

// Matches PromptCard's layout so the grid doesn't jump when real data arrives.
export function PromptCardSkeleton() {
  return (
    <div className="card p-4 flex flex-col gap-3 animate-pulse">
      <div className="flex items-start justify-between gap-2">
        <div className="h-4 bg-base-700 rounded w-2/3" />
        <div className="h-4 w-4 bg-base-700 rounded-full" />
      </div>
      <div className="h-3 bg-base-700 rounded w-full" />
      <div className="h-3 bg-base-700 rounded w-4/5" />
      <div className="flex gap-1">
        <div className="h-4 w-12 bg-base-700 rounded-full" />
        <div className="h-4 w-16 bg-base-700 rounded-full" />
      </div>
    </div>
  );
}
