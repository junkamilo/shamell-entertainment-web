/** Narrow response shapes for auth e2e / deep HTTP tests (no any). */

export type ErrorBody = {
  statusCode: number;
  message: string | string[];
  error?: string;
};

export type AdminLoginBody = {
  message: string;
  accessToken: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    permissions: string[];
  };
};

export type InviteSentBody = {
  message: string;
  email: string;
};

export type InviteVerifiedBody = {
  message: string;
  email: string;
};

export type ForgotPasswordBody = {
  message: string;
  resetLink?: string;
};

export type ResetPasswordBody = {
  message: string;
};

export type BootstrapAdminBody = {
  message: string;
  user: {
    id: string;
    email: string;
    role: string;
    permissions: string[];
  };
};
