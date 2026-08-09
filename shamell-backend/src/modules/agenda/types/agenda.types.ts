export type AgendaHubBadgesResponse = {
  peticionesBadge: number;
  paymentHistoryBadge: number;
};

export type AgendarCatalogServiceItem = {
  id: string;
  serviceTypeName: string;
};

export type AgendarCatalogNamedItem = {
  id: string;
  name: string;
};

export type AgendarCatalogResponse = {
  services: AgendarCatalogServiceItem[];
  eventTypes: AgendarCatalogNamedItem[];
  occasions: AgendarCatalogNamedItem[];
};
