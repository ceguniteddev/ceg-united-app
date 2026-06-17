/**
 * Represents a user's membership details.
 */
export interface Membership {
  status: string;
  tier: string;
  [key: string]: any;
}

/**
 * Helper function to safely parse various date formats into a Date object.
 *
 * Supported formats:
 * - A live Date object
 * - A Firestore Timestamp (checks for a toDate method)
 * - A serializable JSON timestamp format (e.g. { seconds: number } or { _seconds: number })
 * - An ISO string or millisecond timestamp
 *
 * @param lastFreePullAt The raw last free pull timestamp.
 * @returns A parsed Date object, or null if invalid/missing.
 */
function parseLastFreePullAt(lastFreePullAt: any): Date | null {
  if (lastFreePullAt === null || lastFreePullAt === undefined) {
    return null;
  }

  // 1. Handle live Date objects
  if (lastFreePullAt instanceof Date) {
    return lastFreePullAt;
  }

  // 2. Handle Firestore Timestamp (checks for toDate function)
  if (typeof lastFreePullAt.toDate === "function") {
    return lastFreePullAt.toDate();
  }

  // 3. Handle serializable JSON timestamp formats
  if (typeof lastFreePullAt === "object") {
    if (typeof lastFreePullAt.seconds === "number") {
      return new Date(lastFreePullAt.seconds * 1000);
    }
    if (typeof lastFreePullAt._seconds === "number") {
      return new Date(lastFreePullAt._seconds * 1000);
    }
  }

  // 4. Handle ISO string or millisecond timestamp
  if (
    typeof lastFreePullAt === "string" ||
    typeof lastFreePullAt === "number"
  ) {
    const parsedDate = new Date(lastFreePullAt);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
  }

  return null;
}

/**
 * Verifies if a user is eligible for a monthly free credit report pull.
 *
 * Eligibility rules:
 * - Must have an active membership (status === "active")
 * - Membership tier must be one of: "tier_starter", "tier_pro", or "tier_executive"
 * - Must not have pulled a free report during the current calendar month/year
 *
 * @param membership The user's membership details.
 * @param lastFreePullAt The timestamp of the user's last free pull.
 * @returns true if the user qualifies for a free pull, false otherwise.
 */
export function checkFreePullEligibility(
  membership: any,
  lastFreePullAt: any,
): boolean {
  // 1. Verify membership exists and is active
  if (!membership || membership.status !== "active") {
    return false;
  }

  // 2. Verify membership tier is eligible
  const eligibleTiers = ["tier_starter", "tier_pro", "tier_executive"];
  if (!eligibleTiers.includes(membership.tier)) {
    return false;
  }

  // 3. If lastFreePullAt is missing, they are eligible (unused)
  if (lastFreePullAt === null || lastFreePullAt === undefined) {
    return true;
  }

  // 4. Safely parse lastFreePullAt into a Date object
  const pullDate = parseLastFreePullAt(lastFreePullAt);

  // If the timestamp is invalid, default to eligible (true)
  if (!pullDate || isNaN(pullDate.getTime())) {
    return true;
  }

  // 5. Check if the calendar month/year is prior to the current month/year
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-indexed (0 = Jan, 11 = Dec)

  const pullYear = pullDate.getFullYear();
  const pullMonth = pullDate.getMonth();

  // If pull year is prior to current year, eligible
  if (pullYear < currentYear) {
    return true;
  }

  // If pull year is current year but pull month is prior to current month, eligible
  if (pullYear === currentYear && pullMonth < currentMonth) {
    return true;
  }

  // Otherwise, they have already pulled this month (or pullDate is in the future)
  return false;
}

/**
 * Determines and formats the monthly free credit report pull status for display.
 *
 * Statuses returned:
 * - "Not Eligible (No active membership)" - If not starter, pro, or executive tier or not active
 * - "Used this month (Last pull: [Formatted Date])" - If eligible but already pulled this month
 * - "Available (1 free pull this month)" - If eligible and has not yet pulled this month
 *
 * @param membership The user's membership details.
 * @param lastFreePullAt The timestamp of the user's last free pull.
 * @param formatDateFn An optional function to customize how the last pull date is formatted.
 * @returns A user-friendly status string.
 */
export function getFreePullStatus(
  membership: any,
  lastFreePullAt: any,
  formatDateFn?: (date: Date) => string,
): string {
  // 1. Check if they have an active eligible membership
  const hasEligibleMembership =
    membership &&
    membership.status === "active" &&
    ["tier_starter", "tier_pro", "tier_executive"].includes(membership.tier);

  if (!hasEligibleMembership) {
    return "Not Eligible (No active membership)";
  }

  // 2. Use checkFreePullEligibility to see if they can pull a report now
  const isEligibleForPull = checkFreePullEligibility(
    membership,
    lastFreePullAt,
  );

  if (isEligibleForPull) {
    return "Available (1 free pull this month)";
  }

  // 3. If they are not eligible for a pull but have an active membership,
  // it means they have already pulled a free report this calendar month.
  const pullDate = parseLastFreePullAt(lastFreePullAt);
  const formattedDate = pullDate
    ? formatDateFn
      ? formatDateFn(pullDate)
      : pullDate.toLocaleDateString()
    : "N/A";

  return `Used this month (Last pull: ${formattedDate})`;
}
