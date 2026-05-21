import { redirect } from "next/navigation";
import { AGREGAR_ADMIN_PATH } from "../agregar-admin/lib/agregarAdminRoutes";

export default function LegacyInviteAdminRedirectPage() {
  redirect(AGREGAR_ADMIN_PATH);
}
