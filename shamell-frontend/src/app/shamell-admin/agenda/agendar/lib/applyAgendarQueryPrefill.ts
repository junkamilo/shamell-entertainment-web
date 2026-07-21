import type { ReadonlyURLSearchParams } from "next/navigation";
import {
  sanitizeIntegerInput,
  sanitizeNameInput,
  sanitizePhoneInput,
} from "./agendarValidation";
import { isQueryUuid } from "./agendarQuery";
import type { AgendarFormState } from "../types/agendarFormState.types";

export function applyAgendarQueryPrefill(
  searchParams: ReadonlyURLSearchParams,
  form: AgendarFormState,
) {
  const qName = searchParams.get("fullName") ?? "";
  const qEmail = searchParams.get("email") ?? "";
  const qPhone = searchParams.get("phone") ?? "";
  const qDate = searchParams.get("eventDate") ?? "";
  const qLocation = searchParams.get("location") ?? "";
  const qStart = searchParams.get("start") ?? "";
  const qEnd = searchParams.get("end") ?? "";
  const qMessage = searchParams.get("message") ?? "";
  const qServiceIds = searchParams.get("serviceIds") ?? "";
  const qServiceId = searchParams.get("serviceId") ?? "";
  const qEventTypeId = searchParams.get("eventTypeId") ?? "";
  const qOccasionTypeId = searchParams.get("occasionTypeId") ?? "";
  const qGuestCount = searchParams.get("guestCount") ?? "";
  const qContactId = searchParams.get("contactId")?.trim() ?? "";

  if (qName) form.setGuestFullName(sanitizeNameInput(qName));
  if (qEmail) form.setGuestEmail(qEmail.trim().toLowerCase());
  if (qPhone) form.setGuestPhone(sanitizePhoneInput(qPhone));
  if (/^\d{4}-\d{2}-\d{2}$/.test(qDate)) form.setEventDateIso(qDate);
  if (qLocation) form.setLocation(qLocation.trim());
  if (/^\d{2}:\d{2}$/.test(qStart)) form.setEventTimeStart(qStart);
  if (/^\d{2}:\d{2}$/.test(qEnd)) form.setEventTimeEnd(qEnd);
  if (qMessage) form.setNotes(qMessage.trim());
  if (qServiceIds.trim()) {
    const parts = qServiceIds
      .split(",")
      .map((s) => s.trim())
      .filter((s) => isQueryUuid(s));
    if (parts.length > 0) form.setServiceIds(parts);
  } else if (isQueryUuid(qServiceId)) form.setServiceIds([qServiceId.trim()]);
  if (isQueryUuid(qEventTypeId)) form.setEventTypeId(qEventTypeId.trim());
  if (isQueryUuid(qOccasionTypeId)) form.setOccasionTypeId(qOccasionTypeId.trim());
  if (/^\d+$/.test(qGuestCount.trim())) form.setGuestCount(sanitizeIntegerInput(qGuestCount.trim()));
  if (isQueryUuid(qContactId)) form.setLinkedContactRequestId(qContactId.trim());
  else form.setLinkedContactRequestId("");
}
