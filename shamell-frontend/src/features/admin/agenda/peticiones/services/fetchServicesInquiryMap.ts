import {
  fetchAgendaCatalogMaps,
  parseServicesInquiryMap,
  type ServicesInquiryMapResult,
} from "../../shared/services/fetchAgendaCatalogMaps";

export type { ServicesInquiryMapResult };

export async function fetchServicesInquiryMap(token: string): Promise<ServicesInquiryMapResult> {
  const raw = await fetchAgendaCatalogMaps({ token });
  return parseServicesInquiryMap(raw.services);
}
