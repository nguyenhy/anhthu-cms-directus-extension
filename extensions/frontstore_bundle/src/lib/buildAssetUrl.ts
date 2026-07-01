import { buildUrl } from "./buildUrl";

/**
 * Reference: https://directus.com/docs/guides/files/transform#custom-transformations
 * Options for transforming Directus image assets.
 * Accepts either custom parameters, a preset key string, or advanced Sharp transforms.
 */
interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  fit?: "cover" | "contain" | "inside" | "outside";
  withoutEnlargement?: boolean;
  format?: "auto" | "jpg" | "png" | "webp" | "tiff";
  key?: string; // For Preset Transformations
  transforms?: Array<[string, ...unknown[]]>; // For Advanced Sharp Transformations
}

/**
 * Generates Directus asset URL with transformation parameters
 * @param {string} token - The file ID / asset token
 * @param {ImageTransformOptions} [options] - Transformation configurations
 */
export function buildAssetUrl(
  token: string,
  base: string,
  options?: ImageTransformOptions,
): string {
  const url = new URL(buildUrl(`/assets/${token}`, base));

  if (!options) {
    return url.toString();
  }

  // Handle Preset Transformations key
  if (options.key) {
    url.searchParams.set("key", options.key);
    return url.toString();
  }

  // Handle Advanced Sharp Transformations matrix
  if (options.transforms && options.transforms.length > 0) {
    url.searchParams.set("transforms", JSON.stringify(options.transforms));
  }

  // Handle Custom Transformations parameters
  if (options.width) {
    url.searchParams.set("width", options.width.toString());
  }

  if (options.height) {
    url.searchParams.set("height", options.height.toString());
  }

  if (options.quality) {
    url.searchParams.set("quality", options.quality.toString());
  }

  if (options.fit) {
    url.searchParams.set("fit", options.fit);
  }

  if (options.format) {
    url.searchParams.set("format", options.format);
  }

  if (options.withoutEnlargement !== undefined) {
    url.searchParams.set(
      "withoutEnlargement",
      options.withoutEnlargement.toString(),
    );
  }

  return url.toString();
}
