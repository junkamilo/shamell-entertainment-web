import { redirect } from "next/navigation";
import { ON_COMING_EVENTS_PUBLIC_PATH } from "@/lib/onComingEventsRoutes";

export default function UpcomingEventsRedirectPage() {
  redirect(ON_COMING_EVENTS_PUBLIC_PATH);
}
