import type {
  AdminPermission,
  AdminStaffRole,
} from '../types/admin-auth.types';

export type {
  AdminPermission,
  AdminStaffRole,
} from '../types/admin-auth.types';

/** Coarse admin staff roles that may access /admin APIs. */
export const ADMIN_STAFF_ROLES: readonly AdminStaffRole[] = [
  'ADMIN',
  'SUPER_ADMIN',
];

export const ADMIN_PERMISSIONS: readonly AdminPermission[] = [
  'admin.invite',
  'admin.access',
  'catalog.manage',
  'agenda.manage',
  'venue.manage',
  'content.manage',
];

const ALL_EXCEPT_INVITE: AdminPermission[] = ADMIN_PERMISSIONS.filter(
  (p) => p !== 'admin.invite',
);

export function isAdminStaffRole(role: string | null | undefined): boolean {
  return (
    role === 'ADMIN' ||
    role === 'SUPER_ADMIN' ||
    (ADMIN_STAFF_ROLES as readonly string[]).includes(role ?? '')
  );
}

export function deriveAdminPermissions(
  role: string | null | undefined,
): AdminPermission[] {
  if (role === 'SUPER_ADMIN') {
    return [...ADMIN_PERMISSIONS];
  }
  if (role === 'ADMIN') {
    return [...ALL_EXCEPT_INVITE];
  }
  return [];
}

export function hasAdminPermission(
  permissions: readonly string[] | null | undefined,
  required: AdminPermission | readonly AdminPermission[],
): boolean {
  if (!permissions?.length) return false;
  const need: readonly AdminPermission[] = Array.isArray(required)
    ? required
    : [required];
  return need.every((p) => permissions.includes(p));
}
