import { nestApiErrorMessage } from "@/lib/nestApiErrorMessage";

export function parseEventsError(data: unknown, fallback: string): string {
  return nestApiErrorMessage(data, fallback);
}
