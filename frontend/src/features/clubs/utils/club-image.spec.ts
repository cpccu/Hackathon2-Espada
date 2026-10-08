import { describe, expect, it } from "vitest";
import { getClubInitials, isValidImageUrl } from "./club-image";

describe("isValidImageUrl", () => {
  it("accepts valid http and https URLs", () => {
    expect(isValidImageUrl("https://campusos.dev/logo.png")).toBe(true);
    expect(isValidImageUrl("http://images.unsplash.com/photo.jpg")).toBe(true);
  });

  it("accepts relative public paths and data URLs", () => {
    expect(isValidImageUrl("/images/clubs/logo.png")).toBe(true);
    expect(isValidImageUrl("data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==")).toBe(true);
  });

  it("rejects null, undefined, empty, or whitespace strings", () => {
    expect(isValidImageUrl(null)).toBe(false);
    expect(isValidImageUrl(undefined)).toBe(false);
    expect(isValidImageUrl("")).toBe(false);
    expect(isValidImageUrl("   ")).toBe(false);
  });

  it("rejects dummy placeholder domains like .invalid", () => {
    expect(isValidImageUrl("https://example.invalid/campusos/clubs/logo.png")).toBe(false);
    expect(isValidImageUrl("http://test.example/image.png")).toBe(false);
  });

  it("rejects malformed and non-http URLs", () => {
    expect(isValidImageUrl("not-a-valid-url")).toBe(false);
    expect(isValidImageUrl("ftp://example.com/logo.png")).toBe(false);
    expect(isValidImageUrl("javascript:alert(1)")).toBe(false);
    expect(isValidImageUrl("[object Object]")).toBe(false);
  });
});

describe("getClubInitials", () => {
  it("derives two-letter initials from multi-word club names", () => {
    expect(getClubInitials("Computer Club")).toBe("CC");
    expect(getClubInitials("Cultural Society")).toBe("CS");
    expect(getClubInitials("Robotics Society")).toBe("RS");
  });

  it("derives initials from single-word or short club names", () => {
    expect(getClubInitials("ACM")).toBe("AC");
    expect(getClubInitials("IEEE")).toBe("IE");
    expect(getClubInitials("C")).toBe("C");
  });

  it("handles empty or invalid club names safely", () => {
    expect(getClubInitials("")).toBe("");
    expect(getClubInitials(null)).toBe("");
    expect(getClubInitials(undefined)).toBe("");
    expect(getClubInitials("   ")).toBe("");
  });
});
