export function createAgendaPaymentsDepMock() {
  return {
    countBadgeSince: jest.fn().mockResolvedValue({ count: 0 }),
  };
}

export type AgendaPaymentsDepMock = ReturnType<
  typeof createAgendaPaymentsDepMock
>;
