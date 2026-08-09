import type { UserRole } from '@prisma/client';

export type RegisteredUserView = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: UserRole;
  createdAt: Date;
};

export type RegisterUserResult = {
  message: string;
  user: RegisteredUserView;
};
