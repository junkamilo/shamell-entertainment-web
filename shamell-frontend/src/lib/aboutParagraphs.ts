/** Split About body: each line break starts a new paragraph; empty lines are skipped. */
export function splitAboutParagraphs(body: string): string[] {
  return body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}
