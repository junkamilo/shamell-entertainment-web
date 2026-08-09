import { ConfigService } from '@nestjs/config';
import { DEFAULT_ADMIN_OPS_EMAIL } from '../constants/mail.constants';
import { resolveAdminOpsEmail } from './admin-ops-email.util';

describe('admin-ops-email.util', () => {
  it('returns env override when set', () => {
    const config = {
      get: jest.fn().mockReturnValue(' ops@custom.com '),
    } as unknown as ConfigService;
    expect(resolveAdminOpsEmail(config)).toBe('ops@custom.com');
  });

  it('returns default when env missing', () => {
    const config = {
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as ConfigService;
    expect(resolveAdminOpsEmail(config)).toBe(DEFAULT_ADMIN_OPS_EMAIL);
  });
});
