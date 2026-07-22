import { isValidInquiryCode, type InquiryEntrySource } from "@/lib/contactInquiryConstants";
import { isGalaOrVip, readableInquiryCode } from "./inquiryCodeUtils";
import { SERVICE_OPTION_UUID_RE, type CatalogSnapshot, type PublicServiceOption, type WizardData } from "./wizardTypes";

export function buildInquiryDetails(
  d: WizardData,
  entrySource: InquiryEntrySource,
  activeCatalog: CatalogSnapshot | null,
  serviceTypeOptions: PublicServiceOption[],
): Record<string, unknown> | undefined {
  const out: Record<string, unknown> = { entrySource };

  if (activeCatalog) {
    const title =
      activeCatalog.title.length > 120 ? activeCatalog.title.slice(0, 120) : activeCatalog.title;
    out.sourceCatalogKind = activeCatalog.kind;
    out.sourceCatalogId = activeCatalog.id;
    out.sourceCatalogTitle = title;
  }

  if (d.contactLineKind === "event" && d.contactLineId.trim()) {
    out.eventId = d.contactLineId.trim();
  }
  if (d.eventTypeId.trim()) {
    out.eventTypeId = d.eventTypeId.trim();
  }

  if (d.occasionTypeId.trim()) out.occasionTypeId = d.occasionTypeId.trim();
  if (d.occasionOther.trim()) out.occasionOther = d.occasionOther.trim();

  if (isGalaOrVip(d.inquiryCode) && d.experienceAddons.length) {
    out.experienceAddons = d.experienceAddons;
  }

  if (d.occasionTypeIdsProject.length) out.occasionTypeIdsProject = d.occasionTypeIdsProject;
  if (d.occasionTypeIdsRole.length) out.occasionTypeIdsRole = d.occasionTypeIdsRole;
  if (d.projectDeadlineNote.trim()) out.projectDeadlineNote = d.projectDeadlineNote.trim();

  if (d.eventTimeStart.trim()) out.eventTimeStart = d.eventTimeStart.trim();
  if (d.eventTimeEnd.trim()) out.eventTimeEnd = d.eventTimeEnd.trim();

  if (d.eventAddress.trim()) out.eventAddress = d.eventAddress.trim();

  if (d.guestCount.trim()) {
    const n = Number(d.guestCount);
    if (Number.isFinite(n) && n > 0) out.guestCount = n;
  }

  if (d.venueIndoor === "indoor") out.venueIndoor = true;
  if (d.venueIndoor === "outdoor") out.venueIndoor = false;

  if (d.serviceOptionIds.length) {
    const allUuid = d.serviceOptionIds.every((id) => SERVICE_OPTION_UUID_RE.test(id));
    if (allUuid) out.serviceIds = d.serviceOptionIds;
    const labels = d.serviceOptionIds
      .map((id) => {
        const opt = serviceTypeOptions.find((o) => o.id === id);
        if (opt) return opt.title.trim();
        if (isValidInquiryCode(id)) return readableInquiryCode(id);
        return id.trim();
      })
      .filter(Boolean);
    if (labels.length) out.serviceLabels = labels;
  }

  return out;
}

export function lineDescriptionPreview(description: string, max = 140): string {
  const oneLine = description.replace(/\s+/g, " ").trim();
  if (!oneLine) return "";
  return oneLine.length > max ? `${oneLine.slice(0, max - 1)}…` : oneLine;
}
