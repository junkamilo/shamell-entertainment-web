import { redirect } from "next/navigation";
import { AGREGAR_ADMIN_PATH } from "@/features/admin/agregar-admin";

export default function LegacyInviteAdminRedirectPage() {
  redirect(AGREGAR_ADMIN_PATH);
}

