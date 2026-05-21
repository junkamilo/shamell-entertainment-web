import { nestApiErrorMessage } from "@/lib/nestApiErrorMessage";

export function parseAgregarAdminError(data: unknown, fallback: string): string {
  return nestApiErrorMessage(data, fallback);
}
