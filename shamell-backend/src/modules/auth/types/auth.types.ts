export type AdminLoginUserPayload = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  permissions: string[];
};

export type AdminLoginResponse = {
  message: string;
  accessToken: string;
  user: AdminLoginUserPayload;
};

export type ForgotPasswordResponse = {
  message: string;
  resetLink?: string;
};

export type GoogleIdTokenClaims = {
  email: string;
  sub: string;
  name?: string;
};

export type BootstrapAdminUserSelect = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  createdAt: Date;
};
