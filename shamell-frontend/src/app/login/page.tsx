import { redirect } from "next/navigation";

/** Legacy `/login` — admin sign-in lives at `/admin/login`. */
export default function LoginPage() {
  redirect("/");
}
