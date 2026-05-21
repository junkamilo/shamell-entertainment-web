import { Loader2, RefreshCw } from "lucide-react";

type Props = {
  isLoading: boolean;
  totalItems: number;
  pendingCount: number;
  error: string | null;
  onRefresh: () => void;
};

export default function PeticionesStatsBar({
  isLoading,
  totalItems,
  pendingCount,
  error,
  onRefresh,
}: Props) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3 text-[11px] text-foreground/55">
        <span>
          Total: <strong className="text-gold/90">{isLoading ? "…" : totalItems}</strong>
        </span>
        <span className="text-gold/30">|</span>
        <span>
          Pending: <strong className="text-gold/90">{isLoading ? "…" : pendingCount}</strong>
        </span>
        {error ? (
          <>
            <span className="text-gold/30">|</span>
            <span className="text-red-300/90">{error}</span>
          </>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-full border border-gold/30 px-4 py-2 font-brand text-[10px] tracking-[0.14em] text-gold transition hover:bg-gold/10 disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.5} />
          )}
          REFRESH
        </button>
      </div>
    </div>
  );
}
