import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ClubCard } from "./club-card";
import type { Club } from "../types";

describe("ClubCard", () => {
  const mockClub: Club = {
    id: "c0000001-0000-4000-8000-000000000001",
    name: "Computer Club",
    slug: "computer-club",
    description: "Programming contests, workshops and tech talks.",
    logoUrl: "https://campusos.dev/logo.png",
    coverImageUrl: "https://campusos.dev/cover.jpg",
    contactEmail: "computer.club@campusos.dev",
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    _count: {
      events: 4,
      posts: 2,
    },
  };

  it("renders club name, description, and contact email", () => {
    render(<ClubCard club={mockClub} />);

    expect(screen.getByText("Computer Club")).toBeInTheDocument();
    expect(
      screen.getByText("Programming contests, workshops and tech talks."),
    ).toBeInTheDocument();
    expect(screen.getByText("computer.club@campusos.dev")).toBeInTheDocument();
  });

  it("renders event and post count badges", () => {
    render(<ClubCard club={mockClub} />);

    expect(screen.getByText("4 Events")).toBeInTheDocument();
    expect(screen.getByText("2 Posts")).toBeInTheDocument();
  });

  it("renders link pointing to the club detail route", () => {
    render(<ClubCard club={mockClub} />);

    const link = screen.getByRole("link", {
      name: "View details for Computer Club",
    });
    expect(link).toHaveAttribute(
      "href",
      "/clubs/c0000001-0000-4000-8000-000000000001",
    );
  });

  it("renders fallback icon when logo and cover image are not provided", () => {
    const clubWithoutImages: Club = {
      ...mockClub,
      logoUrl: null,
      coverImageUrl: null,
      contactEmail: null,
      _count: undefined,
    };

    render(<ClubCard club={clubWithoutImages} />);

    expect(screen.getByText("Computer Club")).toBeInTheDocument();
    expect(screen.getByText("0 Events")).toBeInTheDocument();
    expect(screen.getByText("0 Posts")).toBeInTheDocument();
  });

  it("renders academic initials fallback when images fail to load", () => {
    const { container } = render(<ClubCard club={mockClub} />);

    // Trigger onError on cover and logo images inside act
    act(() => {
      const images = container.querySelectorAll("img");
      images.forEach((img) => {
        img.dispatchEvent(new Event("error"));
      });
    });

    // Fallback badge should display club initials "CC"
    expect(screen.getByRole("img", { name: "Computer Club logo" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Computer Club cover" })).toBeInTheDocument();
  });

  it("handles invalid or dummy placeholder URLs gracefully", () => {
    const clubWithMockUrls: Club = {
      ...mockClub,
      logoUrl: "https://example.invalid/campusos/clubs/computer-club/logo.png",
      coverImageUrl: "https://example.invalid/campusos/clubs/computer-club/cover.jpg",
    };

    render(<ClubCard club={clubWithMockUrls} />);

    // Should immediately render accessible fallback elements without attempting to load .invalid
    const logoFallback = screen.getByRole("img", { name: "Computer Club logo" });
    const coverFallback = screen.getByRole("img", { name: "Computer Club cover" });
    expect(logoFallback).toBeInTheDocument();
    expect(coverFallback).toBeInTheDocument();
    expect(logoFallback).toHaveTextContent("CC");
    expect(coverFallback).toHaveTextContent("CC");
  });
});
