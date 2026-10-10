import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import helmet from 'helmet';
import type { App } from 'supertest/types';
import { AdminAuthModule } from '@app/common/auth/admin-auth.module';
import { applyHttpObservability } from '@app/common/http/apply-http-observability';
import { AuthModule } from '@app/modules/auth/auth.module';
import { MailService } from '@app/modules/mail/services/mail.service';

export type SentMail = {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
};

/** In-memory MailService: nothing leaves the machine, invite codes stay readable. */
export function createFakeMail() {
  const sent: SentMail[] = [];
  return {
    sent,
    isConfigured: () => true,
    getMissingConfigMessage: () => '',
    resolveFromEmail: () => 'noreply@shamell.test',
    sendTransactional: (mail: SentMail) => {
      sent.push(mail);
      return Promise.resolve({ ok: true });
    },
    /** 6-digit invite code from the latest mail sent to `email`. */
    lastInviteCode(email: string): string {
      const mail = [...sent].reverse().find((m) => m.to === email);
      const code = mail?.text?.match(/\b(\d{6})\b/)?.[1];
      if (!code) {
        throw new Error(`No invite code was mailed to ${email}`);
      }
      return code;
    },
  };
}

export type FakeMail = ReturnType<typeof createFakeMail>;

/**
 * Real auth HTTP stack (controller, service, repository, JWT, guards,
 * throttler) on the local test PostgreSQL, wired like main.ts
 * (helmet, global ValidationPipe, /api/v1 prefix). Only mail is faked.
 *
 * Each call gets its own throttler storage, so rate limits do not leak
 * between describe blocks.
 */
export async function createRealAuthHttpApp(): Promise<{
  app: INestApplication<App>;
  mail: FakeMail;
}> {
  const mail = createFakeMail();

  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
      ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
      AdminAuthModule,
      AuthModule,
    ],
  })
    .overrideProvider(MailService)
    .useValue(mail)
    .compile();

  const app =
    moduleRef.createNestApplication() as unknown as INestApplication<App>;
  applyHttpObservability(app);
  app.use(helmet());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.setGlobalPrefix('api/v1');
  await app.init();

  return { app, mail };
}
