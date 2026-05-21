import { isValidInquiryCode, type ServiceTypeCode } from "@/lib/contactInquiryConstants";
import type { PublicServiceOption } from "./wizardTypes";

/** When multiple catalog services are selected, drive gala/VIP/bespoke rules from the strictest matching code. */
export function mergedInquiryCodeFromSelections(
  ids: string[],
  options: PublicServiceOption[],
): ServiceTypeCode | "" {
  const codes = new Set<ServiceTypeCode>();
  for (const id of ids) {
    const opt = options.find((o) => o.id === id);
    if (opt && isValidInquiryCode(opt.inquiryCode)) codes.add(opt.inquiryCode);
    else if (isValidInquiryCode(id)) codes.add(id);
  }
  if (codes.has("VIP_EVENT")) return "VIP_EVENT";
  if (codes.has("PRIVATE_GALA")) return "PRIVATE_GALA";
  if (codes.has("BESPOKE")) return "BESPOKE";
  if (codes.has("GENERAL")) return "GENERAL";
  return "";
}

export function readableInquiryCode(code: string): string {
  return code.replace(/_/g, " ").trim();
}

export function inferInquiryCodeFromService(
  contactInquiryCode: string | null | undefined,
  title: string,
): ServiceTypeCode {
  if (contactInquiryCode && isValidInquiryCode(contactInquiryCode)) return contactInquiryCode;
  const n = title.toLowerCase();
  if (n.includes("vip")) return "VIP_EVENT";
  if (n.includes("gala")) return "PRIVATE_GALA";
  if (n.includes("bespoke")) return "BESPOKE";
  return "GENERAL";
}

export function isGalaOrVip(code: string): boolean {
  return code === "PRIVATE_GALA" || code === "VIP_EVENT";
}

export function isBespoke(code: string): boolean {
  return code === "BESPOKE";
}
