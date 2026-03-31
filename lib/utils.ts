import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import qs from "query-string";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatAmount = (amount: number) => {
  if (isNaN(amount) || !amount) return 0;
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const parseStringify = (value: any) => JSON.parse(JSON.stringify(value));

export function countTransactionCategories(
  transactions: Transaction[],
): CategoryCount[] {
  const categoryCounts: { [category: string]: number } = {};
  let totalCount = 0;

  // Iterate over each transaction
  transactions &&
    transactions.forEach((transaction) => {
      // Extract the category from the transaction
      const category = transaction.category;

      // If the category exists in the categoryCounts object, increment its count
      if (categoryCounts.hasOwnProperty(category)) {
        categoryCounts[category]++;
      } else {
        // Otherwise, initialize the count to 1
        categoryCounts[category] = 1;
      }

      // Increment total count
      totalCount++;
    });

  // Convert the categoryCounts object to an array of objects
  const aggregatedCategories: CategoryCount[] = Object.keys(categoryCounts).map(
    (category) => ({
      name: category,
      count: categoryCounts[category],
      totalCount,
    }),
  );

  // Sort the aggregatedCategories array by count in descending order
  aggregatedCategories.sort((a, b) => b.count - a.count);

  return aggregatedCategories;
}

interface UrlQueryParams {
  params: string;
  key: string;
  value: string;
}

export function formUrlQuery({ params, key, value }: UrlQueryParams) {
  const currentUrl = qs.parse(params);

  currentUrl[key] = value;

  return qs.stringifyUrl(
    {
      url: window.location.pathname,
      query: currentUrl,
    },
    { skipNull: true },
  );
}

export function decryptId(id: string) {
  return atob(id);
}

export const formatDateTime = (dateString: Date) => {
  const dateTimeOptions: Intl.DateTimeFormatOptions = {
    weekday: "short", // abbreviated weekday name (e.g., 'Mon')
    month: "short", // abbreviated month name (e.g., 'Oct')
    day: "numeric", // numeric day of the month (e.g., '25')
    hour: "numeric", // numeric hour (e.g., '8')
    minute: "numeric", // numeric minute (e.g., '30')
    hour12: true, // use 12-hour clock (true) or 24-hour clock (false)
    year: "numeric",
  };

  const dateDayOptions: Intl.DateTimeFormatOptions = {
    weekday: "short", // abbreviated weekday name (e.g., 'Mon')
    year: "numeric", // numeric year (e.g., '2023')
    month: "2-digit", // abbreviated month name (e.g., 'Oct')
    day: "2-digit", // numeric day of the month (e.g., '25')
  };

  const dateOptions: Intl.DateTimeFormatOptions = {
    month: "short", // abbreviated month name (e.g., 'Oct')
    year: "numeric", // numeric year (e.g., '2023')
    day: "numeric", // numeric day of the month (e.g., '25')
  };

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: "numeric", // numeric hour (e.g., '8')
    minute: "numeric", // numeric minute (e.g., '30')
    hour12: true, // use 12-hour clock (true) or 24-hour clock (false)
  };

  const formattedDateTime: string = new Date(dateString).toLocaleString(
    "en-US",
    dateTimeOptions,
  );

  const formattedDateDay: string = new Date(dateString).toLocaleString(
    "en-US",
    dateDayOptions,
  );

  const formattedDate: string = new Date(dateString).toLocaleString(
    "en-US",
    dateOptions,
  );

  const formattedTime: string = new Date(dateString).toLocaleString(
    "en-US",
    timeOptions,
  );

  return {
    dateTime: formattedDateTime,
    dateDay: formattedDateDay,
    dateOnly: formattedDate,
    timeOnly: formattedTime,
  };
};

export const getTransactionStatus = (date: Date) => {
  const today = new Date();
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(today.getDate() - 2);

  return date > twoDaysAgo ? "Processing" : "Success";
};

export const removeSpecialCharacters = (value: string) => {
  return value.replace(/[^\w\s]/gi, "");
};

// ============================================
// Tradelines Utility Functions
// ============================================

import type { TradelineStatus } from "@/types/tradelines";

/**
 * Get stock status based on available quantity
 */
export function getStockStatus(stock: number): TradelineStatus {
  if (stock === 0) return "out-of-stock";
  if (stock <= 2) return "low-stock";
  return "in-stock";
}

/**
 * Get Tailwind color classes for stock status
 */
export function getStockColor(stock: number): string {
  if (stock === 0) return "text-gray-400 bg-gray-50";
  if (stock <= 2) return "text-amber-600 bg-amber-50";
  return "text-emerald-600 bg-emerald-50";
}

/**
 * Get human-readable stock label
 */
export function getStockLabel(stock: number): string {
  if (stock === 0) return "Out of Stock";
  if (stock <= 2) return `Only ${stock} left`;
  return `${stock} in stock`;
}

/**
 * Get status badge color for purchase status
 */
export function getPurchaseStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "approved":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "pending":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "declined":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
}

/**
 * Calculate time remaining until a date
 */
export function getTimeLeft(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `${days}d ${hours}h left`;

  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${mins}m left`;
}

/**
 * Get tag color classes for special deal tags
 */
export function getTagColor(tag: string): string {
  switch (tag) {
    case "Flash Sale":
      return "bg-red-50 text-red-700 border-red-200";
    case "Limited Time":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "Best Value":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    default:
      return "bg-blue-50 text-blue-700 border-blue-200";
  }
}

/**
 * Format short date for tradeline display (e.g., "2015 Mar")
 */
export function formatDateShort(date: Date | string): string {
  const d = new Date(date);
  const month = d.toLocaleString("en-US", { month: "short" });
  const year = d.getFullYear();
  return `${year} ${month}`;
}

/**
 * Strip HTML tags from string (for API data)
 */
export function stripHtml(html: string): string {
  if (typeof window === "undefined") return html.replace(/<[^>]*>/g, "");
  const el = document.createElement("div");
  el.innerHTML = html;
  return el.textContent ?? el.innerText ?? html;
}

export function getAccountTypeColors(type: AccountTypes) {
  switch (type) {
    case "depository":
      return {
        bg: "bg-blue-25",
        lightBg: "bg-blue-100",
        title: "text-blue-900",
        subText: "text-blue-700",
      };

    case "credit":
      return {
        bg: "bg-success-25",
        lightBg: "bg-success-100",
        title: "text-success-900",
        subText: "text-success-700",
      };

    default:
      return {
        bg: "bg-green-25",
        lightBg: "bg-green-100",
        title: "text-green-900",
        subText: "text-green-700",
      };
  }
}

export const currency = (v: number | string | undefined | null) => {
  if (v === undefined || v === null || v === "" || isNaN(Number(v))) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(v));
};
