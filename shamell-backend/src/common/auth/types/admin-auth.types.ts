export type AdminStaffRole = 'ADMIN' | 'SUPER_ADMIN';

export type AdminPermission =
  | 'admin.invite'
  | 'admin.access'
  | 'catalog.manage'
  | 'agenda.manage'
  | 'venue.manage'
  | 'content.manage';

export type AdminJwtPayload = {
  sub?: string;
  email?: string;
  role?: string;
  permissions?: string[];
};

export type AdminRequestUser = {
  id: string;
  email?: string;
  role?: string;
  permissions?: string[];
};
