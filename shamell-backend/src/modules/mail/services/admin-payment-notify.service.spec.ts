import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { createMailServiceMock } from '../__mocks__/mail.service.mock';
import { AdminPaymentNotifyService } from './admin-payment-notify.service';
import { MailService } from './mail.service';

describe('AdminPaymentNotifyService', () => {
  let service: AdminPaymentNotifyService;
  const mail = createMailServiceMock();
  const configGet = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    configGet.mockImplementation((key: string) => {
      if (key === 'ADMIN_OPS_EMAIL') return 'ops@example.com';
      if (key === 'APP_PUBLIC_NAME') return 'Shamell';
      if (key === 'FRONTEND_URL') return 'https://example.com';
      return undefined;
    });
    const moduleRef = await Test.createTestingModule({
      providers: [
        AdminPaymentNotifyService,
        { provide: MailService, useValue: mail },
        { provide: ConfigService, useValue: { get: configGet } },
      ],
    }).compile();
    service = moduleRef.get(AdminPaymentNotifyService);
  });

  it('notifyPaymentOutcome calls MailService and does not throw on failure', async () => {
    mail.sendTransactional.mockResolvedValue({
      ok: false,
      errorText: 'provider_error',
    });
    await expect(
      service.notifyPaymentOutcome({
        outcome: 'PAID',
        flow: 'BOOKING_QUOTE',
        customerName: 'Ada',
        customerEmail: 'ada@example.com',
        amount: 100,
        contextLabel: 'Quote #1',
      }),
    ).resolves.toBeUndefined();
    expect(mail.sendTransactional).toHaveBeenCalled();
  });
});
