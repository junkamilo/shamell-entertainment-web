import { nestApiErrorMessage } from "@/lib/nestApiErrorMessage";

export function parseOccasionTypesError(data: unknown, fallback: string): string {
  return nestApiErrorMessage(data, fallback);
}
