import { describe, expect, it } from "vitest";
import {
  getEventLifecycleStatus,
  getEventLifecycleStatusStyles,
} from "./event-status";

describe("getEventLifecycleStatus", () => {
  const startTime = "2026-11-10T10:00:00.000Z";
  const endTime = "2026-11-12T18:00:00.000Z";

  it("returns UPCOMING when current time is strictly before event start", () => {
    const beforeStart = new Date("2026-11-10T09:59:59.999Z");
    expect(getEventLifecycleStatus(startTime, endTime, beforeStart)).toBe(
      "UPCOMING",
    );
  });

  it("returns ONGOING when current time equals event start time", () => {
    const atStart = new Date("2026-11-10T10:00:00.000Z");
    expect(getEventLifecycleStatus(startTime, endTime, atStart)).toBe(
      "ONGOING",
    );
  });

  it("returns ONGOING when current time is between event start and end time", () => {
    const duringEvent = new Date("2026-11-11T12:00:00.000Z");
    expect(getEventLifecycleStatus(startTime, endTime, duringEvent)).toBe(
      "ONGOING",
    );
  });

  it("returns ENDED when current time equals event end time", () => {
    const atEnd = new Date("2026-11-12T18:00:00.000Z");
    expect(getEventLifecycleStatus(startTime, endTime, atEnd)).toBe("ENDED");
  });

  it("returns ENDED when current time is after event end time", () => {
    const afterEnd = new Date("2026-11-12T18:00:01.000Z");
    expect(getEventLifecycleStatus(startTime, endTime, afterEnd)).toBe("ENDED");
  });

  it("handles Date objects as inputs", () => {
    const start = new Date("2026-05-01T00:00:00Z");
    const end = new Date("2026-05-02T00:00:00Z");
    const now = new Date("2026-04-01T00:00:00Z");
    expect(getEventLifecycleStatus(start, end, now)).toBe("UPCOMING");
  });
});

describe("getEventLifecycleStatusStyles", () => {
  it("provides distinct styling classes for each status", () => {
    expect(getEventLifecycleStatusStyles("UPCOMING")).toContain("bg-blue-50");
    expect(getEventLifecycleStatusStyles("ONGOING")).toContain("bg-emerald-50");
    expect(getEventLifecycleStatusStyles("ENDED")).toContain("bg-slate-100");
  });
});
