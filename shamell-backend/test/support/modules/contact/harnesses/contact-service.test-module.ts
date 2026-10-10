import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { createAvailabilityServiceMock } from '@test-support/modules/availability/mocks/availability.service.mock';
import { AvailabilityService } from '@app/modules/availability/services/availability.service';
import { EmailVerificationService } from '@app/modules/email-verification/services/email-verification.service';
import { createBookingsServiceMock } from '@test-support/modules/bookings/mocks/bookings.service.mock';
import { BookingsService } from '@app/modules/bookings/services/bookings.service';
import { createAdminCustomerActivityNotifyServiceMock } from '@test-support/modules/mail/mocks/admin-customer-activity-notify.service.mock';
import { createMailServiceMock } from '@test-support/modules/mail/mocks/mail.service.mock';
import { AdminCustomerActivityNotifyService } from '@app/modules/mail/services/admin-customer-activity-notify.service';
import { MailService } from '@app/modules/mail/services/mail.service';
import { EMAIL_VERIFICATION_REQUIRED_MESSAGE } from '@app/modules/email-verification/constants/email-verification.constants';
import { createContactInboxServiceMock } from '@test-support/modules/contact/mocks/contact-inbox.service.mock';
import { createContactRepositoryMock } from '@test-support/modules/contact/mocks/contact.repository.mock';
import { createRecaptchaVerifierMock } from '@test-support/modules/contact/mocks/recaptcha.verifier.mock';
import { ContactInboxService } from '@app/modules/contact/services/contact-inbox.service';
import { ContactRepository } from '@app/modules/contact/services/contact.repository';
import { ContactService } from '@app/modules/contact/services/contact.service';
import { RecaptchaVerifier } from '@app/modules/contact/services/recaptcha.verifier';

export type ContactServiceTestHarness = {
  moduleRef: TestingModule;
  service: ContactService;
  repository: ReturnType<typeof createContactRepositoryMock>;
  inbox: ReturnType<typeof createContactInboxServiceMock>;
  availability: ReturnType<typeof createAvailabilityServiceMock>;
  mail: ReturnType<typeof createMailServiceMock>;
  adminActivityNotify: ReturnType<
    typeof createAdminCustomerActivityNotifyServiceMock
  >;
  bookings: ReturnType<typeof createBookingsServiceMock>;
  recaptcha: ReturnType<typeof createRecaptchaVerifierMock>;
  emailVerification: {
    consumeVerifiedToken: jest.Mock;
  };
  config: { get: jest.Mock };
};

export async function createContactServiceTestModule(): Promise<ContactServiceTestHarness> {
  const repository = createContactRepositoryMock();
  const inbox = createContactInboxServiceMock();
  const availability = createAvailabilityServiceMock();
  const mail = createMailServiceMock();
  const adminActivityNotify = createAdminCustomerActivityNotifyServiceMock();
  const bookings = createBookingsServiceMock();
  const recaptcha = createRecaptchaVerifierMock();
  const emailVerification = {
    consumeVerifiedToken: jest.fn(({ token }: { token?: string }) => {
      if (!token) {
        throw new BadRequestException(EMAIL_VERIFICATION_REQUIRED_MESSAGE);
      }
      return Promise.resolve();
    }),
  };
  const config = {
    get: jest.fn((key: string) => {
      if (key === 'APP_PUBLIC_NAME') return 'Shamell Entertainment';
      if (key === 'FRONTEND_URL') return 'http://localhost:3000';
      if (key === 'NODE_ENV') return 'test';
      return undefined;
    }),
  };

  availability.bookingTimeZone.mockReturnValue('America/New_York');
  availability.assertDateTimeAllowed.mockResolvedValue(undefined);
  repository.asPrisma.mockReturnValue({});
  repository.findOccasionTypeNamesByIds.mockResolvedValue([]);
  repository.findEventTypeNameById.mockResolvedValue(null);
  mail.sendTransactional.mockResolvedValue({ ok: true });

  const moduleRef = await Test.createTestingModule({
    providers: [
      ContactService,
      { provide: ContactRepository, useValue: repository },
      { provide: AvailabilityService, useValue: availability },
      { provide: MailService, useValue: mail },
      {
        provide: AdminCustomerActivityNotifyService,
        useValue: adminActivityNotify,
      },
      { provide: ConfigService, useValue: config },
      { provide: BookingsService, useValue: bookings },
      { provide: ContactInboxService, useValue: inbox },
      { provide: RecaptchaVerifier, useValue: recaptcha },
      { provide: EmailVerificationService, useValue: emailVerification },
    ],
  }).compile();

  return {
    moduleRef,
    service: moduleRef.get(ContactService),
    repository,
    inbox,
    availability,
    mail,
    adminActivityNotify,
    bookings,
    recaptcha,
    emailVerification,
    config,
  };
}
