/**
 * Bengali Language and Numeral Utilities for Kalobazar.shop
 */

export const BENGALI_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
export const ENGLISH_DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

const BN_TO_EN_MAP: Record<string, string> = {
  "০": "0",
  "১": "1",
  "২": "2",
  "৩": "3",
  "৪": "4",
  "৫": "5",
  "৬": "6",
  "৭": "7",
  "৮": "8",
  "৯": "9",
};

const EN_TO_BN_MAP: Record<string, string> = {
  "0": "০",
  "1": "১",
  "2": "২",
  "3": "৩",
  "4": "৪",
  "5": "৫",
  "6": "৬",
  "7": "৭",
  "8": "৮",
  "9": "৯",
};

/**
 * Converts any English digits (0-9) in a string or number to Bengali digits (০-৯)
 * @example toBengaliNumber(120) => "১২০"
 * @example toBengaliNumber("1 year") => "১ year"
 */
export function toBengaliNumber(val: number | string | undefined | null): string {
  if (val === undefined || val === null) return "";
  const str = String(val);
  return str.replace(/[0-9]/g, (d) => EN_TO_BN_MAP[d] || d);
}

/**
 * Converts any Bengali digits (০-৯) in a string to standard English digits (0-9)
 * Essential for customer phone numbers, OTPs, amounts, and payment gateways.
 * @example toEnglishNumber("০১৭১২৩৪৫৬৭৮") => "01712345678"
 */
export function toEnglishNumber(val: string | number | undefined | null): string {
  if (!val) return "";
  const str = String(val);
  return str.replace(/[০-৯]/g, (d) => BN_TO_EN_MAP[d] || d);
}

/**
 * Clean and normalize a Bangladeshi phone number:
 * 1. Converts Bengali digits to English digits
 * 2. Removes spaces, dashes, parentheses
 * 3. Returns standard 11-digit format starting with 01
 * @example normalizeBanglaPhone("০১৭১২-৩৪৫৬৭৮") => "01712345678"
 */
export function normalizeBanglaPhone(phone: string): string {
  if (!phone) return "";
  const en = toEnglishNumber(phone);
  const cleaned = en.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+8801")) {
    return cleaned.slice(3);
  }
  if (cleaned.startsWith("8801")) {
    return cleaned.slice(2);
  }
  return cleaned;
}

/**
 * Formats a currency amount with BDT Taka sign (৳)
 * @param amount Number or string
 * @param options.banglaDigits Whether to display numerals in Bengali (default: false)
 */
export function formatPrice(
  amount: number | string,
  options?: { banglaDigits?: boolean }
): string {
  const num = typeof amount === "string" ? parseFloat(amount) || 0 : amount;
  const formatted = num.toLocaleString("en-US");
  if (options?.banglaDigits) {
    return `৳${toBengaliNumber(formatted)}`;
  }
  return `৳${formatted}`;
}
