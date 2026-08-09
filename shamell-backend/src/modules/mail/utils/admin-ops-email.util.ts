import { ConfigService } from '@nestjs/config';
import {
  DEFAULT_ADMIN_OPS_EMAIL,
  ENV_ADMIN_OPS_EMAIL,
} from '../constants/mail.constants';

/** Inbox for Shamell ops (payments + customer activity mirrors). */
export function resolveAdminOpsEmail(config: ConfigService): string {
  return (
    config.get<string>(ENV_ADMIN_OPS_EMAIL)?.trim() || DEFAULT_ADMIN_OPS_EMAIL
  );
}
