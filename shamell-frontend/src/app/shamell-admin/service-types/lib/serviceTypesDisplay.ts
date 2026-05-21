import { TYPE_ICONS } from "./serviceTypesConstants";
import type { ServiceTypeItem } from "../types/serviceTypes.types";

export function iconIndexForTypeName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % TYPE_ICONS.length;
}

export function buildServiceTypeSubtitle(item: ServiceTypeItem): string {
  const svc = item.serviceCount ?? 0;
  const gal = item.galleryPhotoCount ?? 0;
  if (svc > 0) {
    return `${svc === 1 ? "1 service" : `${svc} services`} linked. Cannot hide or delete until those links are gone.`;
  }
  if (gal > 0) {
    return `${gal} linked gallery photo(s). Remove them or unlink before deleting this type.`;
  }
  return "No linked services. You can hide or delete if you do not need it.";
}
