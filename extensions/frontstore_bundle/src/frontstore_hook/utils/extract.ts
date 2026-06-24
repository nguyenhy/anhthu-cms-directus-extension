// 1. Core Object Guard
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

// 2. Extract Key (Returns unknown)
export function getRawKey(obj: unknown, key: string): unknown {
  if (isObject(obj) && key in obj) {
    return obj[key];
  }
  return undefined;
}

// 3. Simple Type Guards
export function isString(value: unknown): value is string {
  return typeof value === "string";
}

export function isNumber(value: unknown): value is number {
  return typeof value === "number";
}

// 4. Granular Number Guards
export function isUsableNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function isPositiveNumber(value: unknown): value is number {
  return isUsableNumber(value) && value > 0;
}

export function isNegativeNumber(value: unknown): value is number {
  return isUsableNumber(value) && value < 0;
}
