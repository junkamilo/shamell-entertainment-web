import Link from "next/link";
import { SERVICE_TYPES_PATH } from "@/features/admin/service-types/lib/serviceTypesRoutes";

export default function ServicesNoTypesBanner() {
  return (
    <div className="mb-8 shamell-glass-surface rounded-xl px-5 py-4 text-sm text-foreground/75">
      No active service types.{" "}
      <Link href={SERVICE_TYPES_PATH} className="text-gold underline underline-offset-2">
        Go to service types
      </Link>
      .
    </div>
  );
}
