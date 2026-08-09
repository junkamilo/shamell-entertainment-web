import { adminLoginUserPayload } from './auth-payload.util';

describe('auth-payload.util', () => {
  it('derives invite permission for SUPER_ADMIN', () => {
    const payload = adminLoginUserPayload({
      id: '1',
      fullName: 'Super',
      email: 'super@example.com',
      role: 'SUPER_ADMIN',
    });
    expect(payload.permissions).toContain('admin.invite');
  });

  it('does not grant invite permission to ADMIN', () => {
    const payload = adminLoginUserPayload({
      id: '2',
      fullName: 'Admin',
      email: 'admin@example.com',
      role: 'ADMIN',
    });
    expect(payload.permissions).not.toContain('admin.invite');
  });
});
