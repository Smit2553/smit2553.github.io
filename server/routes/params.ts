export function readRouteParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return (value[0] ?? "").trim();
  }

  if (typeof value === "string") {
    return value.trim();
  }

  return "";
}

export function readPositiveIntegerQueryParam(value: unknown, maximum = 100): number | undefined | null {
  if (value === undefined) {
    return undefined;
  }

  if (Array.isArray(value) || typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  if (normalized.length === 0) {
    return null;
  }

  const parsed = Number(normalized);

  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > maximum) {
    return null;
  }

  return parsed;
}
