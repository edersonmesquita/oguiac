export function sanitizeShareText(value: string): string {
  return value
    .replace(/\uFFFD+/g, '') // remove replacement chars: �
    .replace(/\s{2,}/g, ' ')
    .trim();
}
