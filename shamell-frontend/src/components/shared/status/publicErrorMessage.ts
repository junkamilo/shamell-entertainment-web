export const PUBLIC_ERROR_FALLBACK = "An unexpected error occurred.";

export function publicErrorMessage(
  error: Error & { digest?: string },
  opts?: { isDev?: boolean },
): string {
  const isDev = opts?.isDev ?? process.env.NODE_ENV === "development";
  if (!isDev) return PUBLIC_ERROR_FALLBACK;
  const message = typeof error.message === "string" ? error.message.trim() : "";
  return message || PUBLIC_ERROR_FALLBACK;
}
