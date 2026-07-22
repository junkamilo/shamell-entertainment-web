import { nestApiErrorMessage } from "@/lib/nestApiErrorMessage";

export function parseServicesError(data: unknown, fallback: string): string {
  return nestApiErrorMessage(data, fallback);
}
