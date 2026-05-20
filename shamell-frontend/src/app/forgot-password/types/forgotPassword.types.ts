export type PasswordFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
};

export type ForgotPasswordActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

export type ResetPasswordActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string };
