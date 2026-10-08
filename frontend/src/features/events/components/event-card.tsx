import Link from "next/link";
import { Calendar, MapPin, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EventItem } from "../types";
import {
  getEventLifecycleStatus,
  getEventLifecycleStatusStyles,
} from "../utils/event-status";

interface EventCardProps {
  event: EventItem;
}

export function EventCard({ event }: EventCardProps) {
  const startDate = new Date(event.startTime).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const startTimeStr = new Date(event.startTime).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  const lifecycleStatus = getEventLifecycleStatus(event.startTime, event.endTime);
  const statusBadgeStyle = getEventLifecycleStatusStyles(lifecycleStatus);

  return (
    <Card className="flex flex-col h-full overflow-hidden hover:border-primary/40 hover:shadow-md transition-all duration-200 shadow-2xs group">
      {/* Event Cover or Header Banner */}
      <div className="relative h-40 w-full bg-muted/40 border-b border-border/60 overflow-hidden">
        {event.coverImageUrl ? (
          <img
            src={event.coverImageUrl}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-6 text-center bg-gradient-to-br from-blue-50/50 via-slate-50 to-muted/40">
            <span className="text-2xl font-bold text-primary/30 tracking-wider uppercase select-none font-sans">
              {event.eventType}
            </span>
          </div>
        )}

        {/* Top-left: Category & Capacity Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="font-semibold shadow-2xs bg-white/95 backdrop-blur-xs text-foreground border border-border/60">
            {event.eventType}
          </Badge>
          {event.isFull && (
            <Badge variant="destructive" className="font-semibold shadow-2xs bg-[#FEF2F2] text-[#C62828] border border-[#FCA5A5]">
              Full
            </Badge>
          )}
        </div>

        {/* Top-right: Lifecycle Status Pill */}
        <div className="absolute top-3 right-3">
          <span
            suppressHydrationWarning
            className={cn(
              "inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-md shadow-2xs backdrop-blur-xs",
              statusBadgeStyle,
            )}
          >
            {lifecycleStatus === "ONGOING" && (
              <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" />
            )}
            {lifecycleStatus}
          </span>
        </div>
      </div>

      <CardHeader className="space-y-1.5 pb-2">
        <div className="text-xs font-medium text-muted-foreground truncate">
          {event.club.name}
        </div>
        <CardTitle className="text-lg line-clamp-1 leading-snug">
          <Link
            href={`/events/${event.id}`}
            className="hover:text-primary transition-colors focus-visible:underline outline-none"
          >
            {event.title}
          </Link>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 space-y-3 pb-4">
        <p className="text-xs text-muted-foreground line-clamp-2">
          {event.description}
        </p>

        <div className="space-y-1.5 text-xs text-muted-foreground pt-1">
          <div className="flex items-center gap-2">
            <Calendar className="size-3.5 shrink-0 text-primary" />
            <span>
              {startDate} at {startTimeStr}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="size-3.5 shrink-0 text-primary" />
            <span className="truncate">{event.location}</span>
          </div>

          {event.maxAttendees !== null && (
            <div className="flex items-center gap-2">
              <Users className="size-3.5 shrink-0 text-primary" />
              <span>
                {event.currentAttendeesCount} / {event.maxAttendees} attendees
              </span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-2 border-t border-border/60">
        <Link
          href={`/events/${event.id}`}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "w-full justify-center text-xs font-medium cursor-pointer",
          )}
        >
          View Details
        </Link>
      </CardFooter>
    </Card>
  );
}
