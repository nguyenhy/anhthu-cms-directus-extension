export function buildOrderUrl(slug: string, base: string, format: string): string {
  const path = format.replace("{slug}", slug);
  return new URL(path, base).toString();
}
