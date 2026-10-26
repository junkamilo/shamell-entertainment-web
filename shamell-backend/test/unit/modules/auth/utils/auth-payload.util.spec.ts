import { adminLoginUserPayload } from '@app/modules/auth/utils/auth-payload.util';

describe('auth-payload.util', () => {
  it('deriva el permiso de invitar para SUPER_ADMIN', () => {
    const payload = adminLoginUserPayload({
      id: '1',
      fullName: 'Super',
      email: 'super@example.com',
      role: 'SUPER_ADMIN',
    });
    expect(payload.permissions).toContain('admin.invite');
  });

  it('no otorga el permiso de invitar a ADMIN', () => {
    const payload = adminLoginUserPayload({
      id: '2',
      fullName: 'Admin',
      email: 'admin@example.com',
      role: 'ADMIN',
    });
    expect(payload.permissions).not.toContain('admin.invite');
  });
});
