import { Loader2 } from "lucide-react";

export function AgendarCatalogSpinner() {
  return (
    <div className="flex justify-center py-12 text-gold">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}
