import { getAdminBearerToken } from "@/app/admin/shared/lib/adminAuth";
import {
  fetchAgendaCatalogMaps,
  parseContactLinesInquiryMap,
} from "../../shared/services/fetchAgendaCatalogMaps";

export async function fetchContactLinesInquiryMap(token?: string): Promise<Map<string, string>> {
  const bearer = token ?? getAdminBearerToken();
  if (!bearer) return new Map();

  const raw = await fetchAgendaCatalogMaps({
    token: bearer,
    includeContactLines: true,
  });
  return parseContactLinesInquiryMap(raw.contactLines);
}
