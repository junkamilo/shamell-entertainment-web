/** POST /api/v1/auth/admin/login */
export type AdminLoginRequestBody = {
  email: string;
  password: string;
};

export type LoginFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
};

export type AdminLoginUserPayload = Record<string, unknown>;

/** Serializable payload returned by `loginAdminAction` to the client. */
export type AdminLoginActionResult =
  | {
      ok: true;
      status: number;
      accessToken: string;
      user?: AdminLoginUserPayload;
    }
  | {
      ok: false;
      status: number;
      message: string;
    };
