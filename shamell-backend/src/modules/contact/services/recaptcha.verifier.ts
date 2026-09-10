import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ENV_GOOGLE_RECAPTCHA_SECRET_KEY,
  GOOGLE_RECAPTCHA_SITEVERIFY_URL,
  RECAPTCHA_HUMAN_FAILED_MESSAGE,
  RECAPTCHA_VERIFY_TIMEOUT_MS,
} from '../constants/recaptcha.constants';

type SiteVerifyBody = {
  success?: boolean;
};

@Injectable()
export class RecaptchaVerifier {
  private readonly logger = new Logger(RecaptchaVerifier.name);

  constructor(private readonly config: ConfigService) {}

  async assertHuman(token: string | undefined): Promise<void> {
    const trimmed = token?.trim() ?? '';
    if (!trimmed) {
      this.reject('missing_token');
    }

    const secret =
      this.config.get<string>(ENV_GOOGLE_RECAPTCHA_SECRET_KEY)?.trim() ?? '';
    if (!secret) {
      this.reject('missing_secret');
    }

    try {
      const res = await fetch(GOOGLE_RECAPTCHA_SITEVERIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ secret, response: trimmed }),
        signal: AbortSignal.timeout(RECAPTCHA_VERIFY_TIMEOUT_MS),
      });
      if (!res.ok) {
        this.reject('siteverify_http');
      }
      const payload = (await res.json()) as SiteVerifyBody;
      if (payload.success !== true) {
        this.reject('success_false');
      }
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      this.reject('siteverify_error');
    }

    this.logger.log('recaptcha.ok');
  }

  private reject(reason: string): never {
    this.logger.warn(`recaptcha.rejected reason=${reason}`);
    throw new BadRequestException(RECAPTCHA_HUMAN_FAILED_MESSAGE);
  }
}
