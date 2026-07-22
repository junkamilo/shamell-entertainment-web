import { cn } from "@/lib/utils";
import type { AgregarAdminPhase } from "../types/agregarAdmin.types";

const STEPS = [
  ["STEP 1", "New administrator"],
  ["STEP 2", "Email code"],
  ["STEP 3", "Password"],
  ["STEP 4", "Finish"],
] as const;

type Props = {
  phase: AgregarAdminPhase;
};

export default function AgregarAdminStepPills({ phase }: Props) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 lg:mb-8 lg:grid-cols-4 lg:gap-4">
      {STEPS.map(([label, value], i) => (
        <div
          key={label}
          className={cn(
            "shamell-glass-surface relative overflow-hidden rounded-xl border px-4 py-3 transition",
            phase === 2 && i >= 1 ? "border-gold/35 bg-gold/8 ring-1 ring-gold/15" : "border-gold/15",
          )}
        >
          <div className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-gold/10 blur-2xl" />
          <p className="relative font-brand text-[10px] tracking-[0.18em] text-gold/75">{label}</p>
          <p className="relative mt-1 truncate font-brand text-base tracking-wide text-gold md:text-lg">
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}
