import { nestApiErrorMessage } from "@/lib/nestApiErrorMessage";

export function parseAboutAdminError(data: unknown, fallback: string): string {
  return nestApiErrorMessage(data, fallback);
}
