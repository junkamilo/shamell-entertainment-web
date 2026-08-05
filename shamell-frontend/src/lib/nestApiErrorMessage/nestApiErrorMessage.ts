/** NestJS ValidationPipe y excepciones suelen devolver `message` como string o string[]. */
export function nestApiErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback;
  const msg = (data as { message?: unknown }).message;
  if (typeof msg === "string" && msg.trim()) return msg.trim();
  if (Array.isArray(msg) && msg.length > 0) {
    return msg
      .map((x) => (typeof x === "string" ? x : typeof x === "object" && x !== null ? JSON.stringify(x) : String(x)))
      .join(" ");
  }
  return fallback;
}
