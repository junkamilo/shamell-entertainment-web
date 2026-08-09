import type { Prisma } from '@prisma/client';
import { serviceCatalogSelect } from '../constants/agenda.constants';
import type { AgendarCatalogServiceItem } from '../types/agenda.types';

export type ServiceCatalogRow = Prisma.ServiceGetPayload<{
  select: typeof serviceCatalogSelect;
}>;

export function mapCatalogServices(
  rows: ServiceCatalogRow[],
): AgendarCatalogServiceItem[] {
  return rows.map((row) => ({
    id: row.id,
    serviceTypeName: row.serviceType.name,
  }));
}
