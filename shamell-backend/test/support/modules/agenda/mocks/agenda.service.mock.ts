export function createAgendaServiceMock() {
  return {
    getHubBadges: jest.fn(),
    getAgendarCatalog: jest.fn(),
  };
}

export type AgendaServiceMock = ReturnType<typeof createAgendaServiceMock>;
