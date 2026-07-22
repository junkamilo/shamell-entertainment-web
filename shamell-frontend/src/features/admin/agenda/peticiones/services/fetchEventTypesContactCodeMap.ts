import {
  fetchAgendaCatalogMaps,
  parseEventTypesContactCodeMap,
} from "../../shared/services/fetchAgendaCatalogMaps";

export async function fetchEventTypesContactCodeMap(token: string): Promise<Map<string, string>> {
  const raw = await fetchAgendaCatalogMaps({ token });
  return parseEventTypesContactCodeMap(raw.eventTypes);
}
