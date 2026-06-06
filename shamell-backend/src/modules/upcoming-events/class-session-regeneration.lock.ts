/** Serializes class session regeneration per reservation template. */
const chains = new Map<string, Promise<unknown>>();

export async function withTemplateRegenerationLock<T>(
  templateId: string,
  fn: () => Promise<T>,
): Promise<T> {
  const previous = chains.get(templateId) ?? Promise.resolve();
  const next = previous.catch(() => undefined).then(fn);
  chains.set(
    templateId,
    next.finally(() => {
      if (chains.get(templateId) === next) {
        chains.delete(templateId);
      }
    }),
  );
  return next;
}
