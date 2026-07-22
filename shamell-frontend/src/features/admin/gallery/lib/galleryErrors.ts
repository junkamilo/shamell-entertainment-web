import { nestApiErrorMessage } from "@/lib/nestApiErrorMessage";

export function parseGalleryError(data: unknown, fallback: string): string {
  return nestApiErrorMessage(data, fallback);
}
