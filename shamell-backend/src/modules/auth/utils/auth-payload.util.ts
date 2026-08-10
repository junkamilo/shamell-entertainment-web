import { deriveAdminPermissions } from '../../../common/auth/constants/admin-permissions.constants';
import type { AdminLoginUserPayload } from '../types/auth.types';

export function adminLoginUserPayload(user: {
  id: string;
  fullName: string;
  email: string;
  role: string;
}): AdminLoginUserPayload {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    permissions: deriveAdminPermissions(user.role),
  };
}
