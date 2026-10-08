export type EventLifecycleStatus = "UPCOMING" | "ONGOING" | "ENDED";

/**
 * Calculates the lifecycle status of an event strictly based on its startTime and endTime:
 * - UPCOMING = current time is before event start
 * - ONGOING = current time is at or after event start AND before event end
 * - ENDED = current time is at or after event end
 *
 * Timezone-safe comparison using absolute epoch milliseconds.
 */
export function getEventLifecycleStatus(
  startTime: string | Date,
  endTime: string | Date,
  now: Date = new Date(),
): EventLifecycleStatus {
  const startMs = new Date(startTime).getTime();
  const endMs = new Date(endTime).getTime();
  const nowMs = now.getTime();

  if (nowMs < startMs) {
    return "UPCOMING";
  }
  if (nowMs < endMs) {
    return "ONGOING";
  }
  return "ENDED";
}

/**
 * Returns restrained, academic design tokens for lifecycle status badges:
 * - UPCOMING: restrained blue styling
 * - ONGOING: restrained green styling
 * - ENDED: neutral/slate or muted styling
 */
export function getEventLifecycleStatusStyles(
  status: EventLifecycleStatus,
): string {
  switch (status) {
    case "UPCOMING":
      return "bg-blue-50 text-blue-700 border border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60";
    case "ONGOING":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60";
    case "ENDED":
      return "bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}
