import { nestApiErrorMessage } from "@/lib/nestApiErrorMessage";

export function parseServiceTypesError(data: unknown, fallback: string): string {
  return nestApiErrorMessage(data, fallback);
}
