export function normalizeDate(value: any): Date | null {
  if (!value) return null;

  let date: Date | null = null;

  if (value instanceof Date) {
    date = value;
  } else if (typeof value?.toDate === "function") {
    date = value.toDate();
  } else if (typeof value?._seconds === "number") {
    date = new Date(value._seconds * 1000);
  } else if (typeof value?.seconds === "number") {
    date = new Date(value.seconds * 1000);
  } else if (typeof value === "string") {
    date = new Date(value);
  } else if (typeof value === "number") {
    date = value < 10000000000 ? new Date(value * 1000) : new Date(value);
  }
  return date;
}

export function formatDate(
  value: any,
  fallback = "-",
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = normalizeDate(value);
  if (!date || isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString(undefined, options);
}

function isValidDateString(value: string): boolean {
  const date = new Date(value);
  return !isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2}T/.test(value);
}

export function normalizeAllDates(obj: any): any {
  if (!obj || typeof obj !== "object") return obj;

  const normalized: any = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];

      if (
        value instanceof Date ||
        typeof value?.toDate === "function" ||
        typeof value?._seconds === "number" ||
        typeof value?.seconds === "number" ||
        (typeof value === "string" && isValidDateString(value))
      ) {
        normalized[key] = normalizeDate(value);
      } else if (typeof value === "object") {
        normalized[key] = normalizeAllDates(value); // Recursive
      } else {
        normalized[key] = value;
      }
    }
  }

  return normalized;
}
