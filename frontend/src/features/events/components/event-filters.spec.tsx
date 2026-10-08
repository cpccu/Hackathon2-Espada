import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EventFilters } from "./event-filters";

describe("EventFilters", () => {
  it("renders with initial search value and category pills", () => {
    const handleFilterChange = vi.fn();
    render(
      <EventFilters
        initialSearch="workshop"
        selectedCategory="Workshop"
        onFilterChange={handleFilterChange}
      />,
    );

    const input = screen.getByPlaceholderText(/search events by title/i);
    expect(input).toHaveValue("workshop");
    expect(screen.getByRole("button", { name: "Workshop" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hackathon" })).toBeInTheDocument();
  });

  it("submits search when search button is clicked", () => {
    const handleFilterChange = vi.fn();
    render(<EventFilters onFilterChange={handleFilterChange} />);

    const input = screen.getByPlaceholderText(/search events by title/i);
    fireEvent.change(input, { target: { value: "seminar" } });

    const submitBtn = screen.getByRole("button", { name: "Search" });
    fireEvent.click(submitBtn);

    expect(handleFilterChange).toHaveBeenCalledWith({
      search: "seminar",
      eventType: undefined,
    });
  });

  it("updates category filter when a category pill is selected", () => {
    const handleFilterChange = vi.fn();
    render(<EventFilters onFilterChange={handleFilterChange} />);

    const hackathonBtn = screen.getByRole("button", { name: "Hackathon" });
    fireEvent.click(hackathonBtn);

    expect(handleFilterChange).toHaveBeenCalledWith({
      search: undefined,
      eventType: "Hackathon",
    });
  });

  it("renders exactly one clear button when search has text, which clears input and filter", () => {
    const handleFilterChange = vi.fn();
    render(
      <EventFilters
        initialSearch="hackathon"
        selectedCategory="Workshop"
        onFilterChange={handleFilterChange}
      />,
    );

    const clearButtons = screen.getAllByRole("button", { name: /Clear search/i });
    expect(clearButtons).toHaveLength(1);

    fireEvent.click(clearButtons[0]);

    const input = screen.getByPlaceholderText(/search events by title/i);
    expect(input).toHaveValue("");
    expect(handleFilterChange).toHaveBeenCalledWith({
      search: undefined,
      eventType: "Workshop",
    });
  });
});
