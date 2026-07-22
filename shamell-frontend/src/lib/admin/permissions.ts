export const ADMIN_PERMISSIONS = [
  "admin.invite",
  "admin.access",
  "catalog.manage",
  "agenda.manage",
  "venue.manage",
  "content.manage",
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

export type AdminStaffRole = "ADMIN" | "SUPER_ADMIN";

const ALL_EXCEPT_INVITE: AdminPermission[] = ADMIN_PERMISSIONS.filter(
  (p) => p !== "admin.invite",
);

export function isAdminStaffRole(role: string | null | undefined): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export function deriveAdminPermissions(
  role: string | null | undefined,
): AdminPermission[] {
  if (role === "SUPER_ADMIN") {
    return [...ADMIN_PERMISSIONS];
  }
  if (role === "ADMIN") {
    return [...ALL_EXCEPT_INVITE];
  }
  return [];
}

export function hasAdminPermission(
  permissions: readonly string[] | null | undefined,
  required: AdminPermission | readonly AdminPermission[],
): boolean {
  if (!permissions?.length) return false;
  const need = Array.isArray(required) ? required : [required];
  return need.every((p) => permissions.includes(p));
}

export function hasAllAdminPermissions(
  permissions: readonly string[] | null | undefined,
  required: readonly AdminPermission[] | undefined,
): boolean {
  if (!required?.length) return true;
  return hasAdminPermission(permissions, required);
}
