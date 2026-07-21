import { redirect } from "next/navigation";
import { ADMIN_LOGIN_PATH } from "@/app/admin/shared/lib/adminRoutes";

/** Legacy `/login` — admin sign-in lives at `/admin/login`. */
export default function LoginPage() {
  redirect(ADMIN_LOGIN_PATH);
}
