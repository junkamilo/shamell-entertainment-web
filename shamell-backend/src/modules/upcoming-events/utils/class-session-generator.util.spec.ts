import { regenerateClassSessionsForEvent } from './class-session-generator.util';

describe('regenerateClassSessionsForEvent', () => {
  it('returns zeros when event has no linked template', async () => {
    const prisma = {
      upcomingVenueConfig: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ reservationEventTemplateId: null }),
      },
    } as unknown as Parameters<typeof regenerateClassSessionsForEvent>[0];

    await expect(
      regenerateClassSessionsForEvent(prisma, 'event-1'),
    ).resolves.toEqual({
      upserted: 0,
      deactivated: 0,
    });
  });
});
