import { nestApiErrorMessage } from "@/lib/nestApiErrorMessage";

export function parseEventTypesError(data: unknown, fallback: string): string {
  return nestApiErrorMessage(data, fallback);
}
