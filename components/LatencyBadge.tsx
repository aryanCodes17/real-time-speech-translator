import { memo } from "react";

type LatencyBadgeProps = {
  latestMs: number;
  averageMs: number;
  totalRequests: number;
};

function LatencyBadgeComponent({
  latestMs,
  averageMs,
  totalRequests,
}: LatencyBadgeProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs dark:border-slate-700 dark:bg-slate-900">
      <span className="text-slate-500 dark:text-slate-400">Last</span>
      <span className="font-semibold tabular-nums text-slate-800 dark:text-slate-100">
        {latestMs > 0 ? `${latestMs}ms` : "—"}
      </span>
      <span className="text-slate-300 dark:text-slate-600">|</span>
      <span className="text-slate-500 dark:text-slate-400">Avg</span>
      <span className="font-semibold tabular-nums text-slate-800 dark:text-slate-100">
        {averageMs > 0 ? `${averageMs}ms` : "—"}
      </span>
      <span className="text-slate-300 dark:text-slate-600">|</span>
      <span className="tabular-nums text-slate-600 dark:text-slate-300">
        {totalRequests} req
      </span>
    </div>
  );
}

export const LatencyBadge = memo(LatencyBadgeComponent);
