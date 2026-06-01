export function standaloneChairStatusBadgeClass(isReserved: boolean): string {
  return isReserved
    ? "inline-flex rounded-full border border-emerald-400/45 bg-emerald-500/10 px-2.5 py-1 font-body text-[11px] text-emerald-200"
    : "inline-flex rounded-full border border-gold/35 bg-gold/10 px-2.5 py-1 font-body text-[11px] text-gold/90";
}

export function standaloneChairStatusLabel(isReserved: boolean): string {
  return isReserved ? "Reserved" : "Available";
}

export function standaloneChairRowClassName(isReserved: boolean): string {
  return isReserved ? "bg-emerald-500/[0.06] ring-1 ring-emerald-400/15" : "";
}
