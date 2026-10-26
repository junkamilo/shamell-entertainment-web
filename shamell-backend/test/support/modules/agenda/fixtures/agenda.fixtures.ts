import type { AgendaHubBadgesQueryDto } from '@app/modules/agenda/dto/agenda-hub-badges-query.dto';
import type {
  AgendaHubBadgesResponse,
  AgendarCatalogResponse,
} from '@app/modules/agenda/types/agenda.types';
import type { ServiceCatalogRow } from '@app/modules/agenda/utils/agenda-catalog.util';

export function makeHubBadgesQuery(
  overrides: Partial<AgendaHubBadgesQueryDto> = {},
): AgendaHubBadgesQueryDto {
  return {
    peticionesBookingsSince: 1_700_000_000_000,
    peticionesGuidanceSince: 1_700_000_000_000,
    peticionesPrivateClassesSince: 1_700_000_000_000,
    paymentsSince: 1_700_000_000_000,
    ...overrides,
  };
}

export function makeHubBadgesResponse(
  overrides: Partial<AgendaHubBadgesResponse> = {},
): AgendaHubBadgesResponse {
  return {
    peticionesBadge: 3,
    paymentHistoryBadge: 2,
    ...overrides,
  };
}

export function makeAgendarCatalogResponse(
  overrides: Partial<AgendarCatalogResponse> = {},
): AgendarCatalogResponse {
  return {
    services: [{ id: 'svc-1', serviceTypeName: 'Dance' }],
    eventTypes: [{ id: 'et-1', name: 'Wedding' }],
    occasions: [{ id: 'occ-1', name: 'Anniversary' }],
    ...overrides,
  };
}

export function makeServiceCatalogRow(
  overrides: Partial<ServiceCatalogRow> = {},
): ServiceCatalogRow {
  return {
    id: 'svc-1',
    serviceType: { name: 'Dance' },
    ...overrides,
  };
}
