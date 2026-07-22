import { nestApiErrorMessage } from "@/lib/nestApiErrorMessage";

export function parseHeaderMediaError(data: unknown, fallback: string): string {
  return nestApiErrorMessage(data, fallback);
}
