export type AgregarAdminPhase = 1 | 2;

export type AdminInvitePayload = {
  email: string;
  fullName: string;
};

export type AdminInviteVerifyPayload = {
  email: string;
  code: string;
  password: string;
};

export type AgregarAdminCardLayout = "mobile" | "desktop";
