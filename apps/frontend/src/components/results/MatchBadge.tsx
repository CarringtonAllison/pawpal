interface MatchBadgeProps {
  score: number;
}

export function MatchBadge({ score }: MatchBadgeProps) {
  const colorClass =
    score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-amber-500' : 'bg-gray-400';

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${colorClass}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
        {score}% Match
      </span>
    </div>
  );
}
