import { redirect } from "next/navigation";
import { SHAMELL_ADMIN_PATH } from "../shared/lib/adminRoutes";

export default function LegacyAdminDashboardRedirectPage() {
  redirect(SHAMELL_ADMIN_PATH);
}
