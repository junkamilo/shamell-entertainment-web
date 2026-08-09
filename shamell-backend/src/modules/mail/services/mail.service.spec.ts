import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { makeTransactionalPayload } from '../__mocks__/mail.fixtures';
import { MailService } from './mail.service';

type MailersendMockModule = {
  MailerSend: jest.Mock;
  __send: jest.Mock;
};

jest.mock('mailersend', () => {
  const send = jest.fn();
  return {
    MailerSend: jest.fn().mockImplementation(() => ({
      email: { send },
    })),
    EmailParams: jest.fn().mockImplementation(() => {
      const api = {
        setFrom: jest.fn().mockReturnThis(),
        setTo: jest.fn().mockReturnThis(),
        setSubject: jest.fn().mockReturnThis(),
        setText: jest.fn().mockReturnThis(),
        setHtml: jest.fn().mockReturnThis(),
      };
      return api;
    }),
    Recipient: jest.fn(),
    Sender: jest.fn(),
    __send: send,
  };
});

import { MailerSend } from 'mailersend';

function getMailersendMock(): MailersendMockModule {
  return jest.requireMock('mailersend') as unknown as MailersendMockModule;
}

describe('MailService', () => {
  let service: MailService;
  const configGet = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    configGet.mockImplementation((key: string) => {
      if (key === 'MAILERSEND_API_KEY') return 'test-key';
      if (key === 'MAILERSEND_FROM_EMAIL') return 'info@example.com';
      if (key === 'MAILERSEND_FROM_NAME') return 'Shamell';
      return undefined;
    });
    const moduleRef = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: ConfigService, useValue: { get: configGet } },
      ],
    }).compile();
    service = moduleRef.get(MailService);
  });

  it('isConfigured is false when API key missing', () => {
    configGet.mockImplementation((key: string) => {
      if (key === 'MAILERSEND_FROM_EMAIL') return 'info@example.com';
      return undefined;
    });
    expect(service.isConfigured()).toBe(false);
  });

  it('sendTransactional skips when not configured', async () => {
    configGet.mockReturnValue(undefined);
    await expect(
      service.sendTransactional(makeTransactionalPayload()),
    ).resolves.toEqual({
      ok: false,
      errorText: 'mailersend not configured',
    });
    expect(MailerSend).not.toHaveBeenCalled();
  });

  it('sendTransactional returns ok when provider succeeds', async () => {
    getMailersendMock().__send.mockResolvedValue(undefined);
    await expect(
      service.sendTransactional(makeTransactionalPayload()),
    ).resolves.toEqual({ ok: true });
  });

  it('sendTransactional returns errorText when provider fails', async () => {
    const errorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    getMailersendMock().__send.mockRejectedValue(new Error('boom'));
    await expect(
      service.sendTransactional(makeTransactionalPayload()),
    ).resolves.toEqual({ ok: false, errorText: 'boom' });
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('isTrialMlsenderDomain detects trial hosts', () => {
    expect(MailService.isTrialMlsenderDomain('a@trial.mlsender.net')).toBe(
      true,
    );
    expect(MailService.isTrialMlsenderDomain('info@example.com')).toBe(false);
  });
});
