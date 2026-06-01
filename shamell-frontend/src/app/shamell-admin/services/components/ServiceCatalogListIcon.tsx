import { Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  size?: "sm" | "md";
};

/**
 * Single catalog icon for all services in list/table views (services have no per-row photo in admin lists).
 */
export default function ServiceCatalogListIcon({ size = "sm" }: Props) {
  const dim = size === "sm" ? "h-11 w-11" : "h-14 w-14";
  const iconClass = size === "sm" ? "h-5 w-5" : "h-6 w-6";

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg border border-gold/30 bg-gold/10",
        dim,
      )}
      aria-hidden
    >
      <Briefcase className={cn("text-gold/90", iconClass)} strokeWidth={1.45} />
    </div>
  );
}
