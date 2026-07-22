import { cn } from "@/lib/utils";
import type { AgregarAdminPhase } from "../types/agregarAdmin.types";

type Props = {
  phase: AgregarAdminPhase;
};

export default function AgregarAdminProgressBar({ phase }: Props) {
  return (
    <div
      className="mb-6 h-1 overflow-hidden rounded-full bg-gold/15 ring-1 ring-gold/10"
      aria-hidden
    >
      <div
        className={cn(
          "h-full rounded-full bg-linear-to-r from-gold/40 via-gold/70 to-gold/40 transition-all duration-500 ease-out",
          phase === 2 ? "w-full" : "w-[38%]",
        )}
      />
    </div>
  );
}
