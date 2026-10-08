/**
 * Safely validates whether a given string is a usable, non-placeholder image URL.
 * Rejects empty/whitespace strings, unparseable URLs, and known placeholder/mock domains
 * such as `.invalid` (RFC 2606) used in seed mocks.
 */
export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed) return false;

  // Reject obvious non-URL strings or serialized placeholders
  if (
    trimmed === "null" ||
    trimmed === "undefined" ||
    trimmed === "[object Object]"
  ) {
    return false;
  }

  // Handle data URLs
  if (trimmed.startsWith("data:image/")) return true;

  // Handle local public paths (e.g., /images/...)
  if (trimmed.startsWith("/")) return true;

  // Validate absolute URLs
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }

    const host = parsed.hostname.toLowerCase();
    // Reject reserved invalid/mock hostnames (RFC 2606) and dummy test strings
    if (
      host.endsWith(".invalid") ||
      host === "invalid" ||
      host.endsWith(".example") ||
      host.endsWith(".test") ||
      host.endsWith(".localhost")
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Extracts clean, academic 1-2 letter initials from a club name.
 * Examples:
 * - "Computer Club" -> "CC"
 * - "Cultural Society" -> "CS"
 * - "Robotics Society" -> "RS"
 * - "ACM" -> "AC"
 * - "IEEE" -> "IE"
 */
export function getClubInitials(name: string | null | undefined): string {
  if (!name || typeof name !== "string") return "";
  const words = name
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);

  if (words.length === 0) return "";
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}
