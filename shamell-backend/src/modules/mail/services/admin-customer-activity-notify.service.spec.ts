import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { createMailServiceMock } from '../__mocks__/mail.service.mock';
import { AdminCustomerActivityNotifyService } from './admin-customer-activity-notify.service';
import { MailService } from './mail.service';

describe('AdminCustomerActivityNotifyService', () => {
  let service: AdminCustomerActivityNotifyService;
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
        AdminCustomerActivityNotifyService,
        { provide: MailService, useValue: mail },
        { provide: ConfigService, useValue: { get: configGet } },
      ],
    }).compile();
    service = moduleRef.get(AdminCustomerActivityNotifyService);
  });

  it('notifyCustomerActivity calls MailService', async () => {
    mail.sendTransactional.mockResolvedValue({ ok: true });
    await expect(
      service.notifyCustomerActivity({
        kind: 'BOOKING_INQUIRY',
        customerName: 'Ada',
        customerEmail: 'ada@example.com',
      }),
    ).resolves.toBeUndefined();
    expect(mail.sendTransactional).toHaveBeenCalled();
  });
});
