export function buildSlugUrl(
  slug: string,
  base: string,
  format: string,
): string {
  const path = format.replace("{slug}", slug);
  return new URL(path, base).toString();
}

export function buildUrl(path: string, base: string): string {
  return new URL(path, base).toString();
}
