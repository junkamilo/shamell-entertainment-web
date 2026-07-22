import { redirect } from "next/navigation";
import { AGENDA_HUB_PATH } from "@/lib/admin/routes";

export default function AdminHomePage() {
  redirect(AGENDA_HUB_PATH);
}
