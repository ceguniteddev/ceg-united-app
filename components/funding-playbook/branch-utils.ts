import type { Branch } from "@/types/funding-playbook";

/**
 * Strips non-digit and non-plus characters from a phone number string for use in tel: links.
 * e.g., "(718) 266-2204" -> "tel:7182662204" or "+1 (718) 266-2204" -> "tel:+17182662204"
 */
export function formatPhoneHref(phone?: string): string {
  if (!phone) return "";
  const sanitized = phone.replace(/[^\d+]/g, "");
  return sanitized ? `tel:${sanitized}` : "";
}

/**
 * Estimates drive time in minutes based on distance in miles.
 * e.g., 3.9 mi -> 11 min, 2.7 mi -> 8 min, 1.5 mi -> 5 min
 */
export function estimateDriveMinutes(distanceMiles: number): number {
  if (!distanceMiles || distanceMiles <= 0) return 3;
  return Math.max(1, Math.round(distanceMiles * 2.5 + 1));
}

/**
 * Generates Google Maps directions link if not explicitly provided.
 */
export function getDirectionsUrl(branch: Branch): string {
  if (branch.googleMapsUrl) return branch.googleMapsUrl;
  const query = encodeURIComponent(`${branch.name} ${branch.address}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

/**
 * Formats weekly hours array into a concise summary line like:
 * "Mon–Fri 9:00am–5:00pm · Sat 9:00am–2:00pm"
 */
export function formatHoursSummary(hours?: string[]): string {
  if (!hours || hours.length === 0) {
    return "Mon–Fri 9:00am–5:00pm · Sat closed";
  }

  // If already formatted or concise string array
  if (hours.length === 1) return hours[0];

  // Try to clean up Google Places style hours strings like ["Monday: 9:00 AM – 5:00 PM", ...]
  const cleaned = hours.map((h) => {
    return h
      .replace(/:\s*/, " ")
      .replace(/AM/gi, "am")
      .replace(/PM/gi, "pm")
      .replace(/\s*–\s*/, "–");
  });

  // Simple clean fallback join
  if (cleaned.length >= 5) {
    // Check if mon-fri are identical
    const monFriSample = cleaned[0]?.split(" ").slice(1).join(" ");
    const satSample = cleaned[5]?.split(" ").slice(1).join(" ");

    if (monFriSample) {
      let satText = satSample ? `Sat ${satSample}` : "Sat closed";
      if (satSample?.toLowerCase().includes("closed")) satText = "Sat closed";
      return `Mon–Fri ${monFriSample}${satText ? ` · ${satText}` : ""}`;
    }
  }

  return cleaned.slice(0, 2).join(" · ");
}

/**
 * Returns open status label like "Open today until 5:00pm" or "Closed today"
 */
export function getOpenStatus(
  openNow?: boolean,
  hours?: string[],
): { isOpen: boolean; label: string } {
  if (openNow === false) {
    return { isOpen: false, label: "Closed right now" };
  }

  if (hours && hours.length > 0) {
    const todayStr = hours[0] || "";
    const match = todayStr.match(/(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm))/gi);
    if (match && match.length >= 2) {
      const closeTime = match[match.length - 1].toLowerCase();
      return { isOpen: true, label: `Open today until ${closeTime}` };
    }
  }

  return { isOpen: true, label: "Open today until 5:00pm" };
}
