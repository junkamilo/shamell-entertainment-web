import {
  ADMIN_PERMISSIONS,
  deriveAdminPermissions,
  hasAdminPermission,
  isAdminStaffRole,
} from './admin-permissions.constants';

describe('admin-permissions.constants', () => {
  it('isAdminStaffRole accepts ADMIN and SUPER_ADMIN', () => {
    expect(isAdminStaffRole('ADMIN')).toBe(true);
    expect(isAdminStaffRole('SUPER_ADMIN')).toBe(true);
    expect(isAdminStaffRole('USER')).toBe(false);
    expect(isAdminStaffRole(null)).toBe(false);
  });

  it('deriveAdminPermissions grants all for SUPER_ADMIN', () => {
    expect(deriveAdminPermissions('SUPER_ADMIN')).toEqual([
      ...ADMIN_PERMISSIONS,
    ]);
  });

  it('deriveAdminPermissions excludes invite for ADMIN', () => {
    const perms = deriveAdminPermissions('ADMIN');
    expect(perms).not.toContain('admin.invite');
    expect(perms).toContain('admin.access');
    expect(perms).toHaveLength(ADMIN_PERMISSIONS.length - 1);
  });

  it('deriveAdminPermissions returns empty for other roles', () => {
    expect(deriveAdminPermissions('USER')).toEqual([]);
    expect(deriveAdminPermissions(undefined)).toEqual([]);
  });

  it('hasAdminPermission checks required permissions', () => {
    expect(hasAdminPermission(['admin.access'], 'admin.access')).toBe(true);
    expect(hasAdminPermission(['admin.access'], 'admin.invite')).toBe(false);
    expect(
      hasAdminPermission(
        ['admin.access', 'venue.manage'],
        ['admin.access', 'venue.manage'],
      ),
    ).toBe(true);
    expect(hasAdminPermission([], 'admin.access')).toBe(false);
    expect(hasAdminPermission(null, 'admin.access')).toBe(false);
  });
});
