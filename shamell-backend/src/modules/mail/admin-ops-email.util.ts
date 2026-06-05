import { ConfigService } from '@nestjs/config';

const DEFAULT_ADMIN_OPS_EMAIL = 'shamellgolden@gmail.com';

/** Inbox for Shamell ops (payments + customer activity mirrors). */
export function resolveAdminOpsEmail(config: ConfigService): string {
  return (
    config.get<string>('ADMIN_OPS_EMAIL')?.trim() || DEFAULT_ADMIN_OPS_EMAIL
  );
}
