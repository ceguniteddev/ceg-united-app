export function normalizeDate(value: any): Date | null {
  if (!value) return null;

  let date: Date | null = null;

  if (value instanceof Date) {
    date = value;
  } else if (typeof value?.toDate === "function") {
    date = value.toDate();
  } else if (typeof value === "string") {
    date = new Date(value);
  }
  return date;
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
