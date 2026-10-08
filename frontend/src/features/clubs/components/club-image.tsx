"use client";

import React, { useState } from "react";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { getClubInitials, isValidImageUrl } from "../utils/club-image";

export interface ClubLogoProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  name: string;
  alt?: string;
  iconClassName?: string;
}

/**
 * Robust logo / avatar component for student clubs.
 * Renders the image when valid and loaded, or falls back to an academic
 * navy/blue badge with club initials or a subtle club icon without showing
 * broken image icons.
 */
export function ClubLogo({
  src,
  name,
  alt,
  className,
  iconClassName,
  ...props
}: ClubLogoProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const hasError = failedSrc === src;
  const showImage = isValidImageUrl(src) && !hasError;
  const initials = getClubInitials(name);
  const accessibleAlt = alt || `${name} logo`;

  if (showImage) {
    return (
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden shrink-0 select-none",
          className,
        )}
        {...props}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src!}
          alt={accessibleAlt}
          className="size-full object-cover"
          loading="lazy"
          onError={() => setFailedSrc(src ?? "")}
        />
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={accessibleAlt}
      className={cn(
        "flex items-center justify-center overflow-hidden shrink-0 select-none font-bold",
        "bg-primary/10 text-primary border border-primary/20",
        "dark:bg-primary/20 dark:text-primary-foreground dark:border-primary/30",
        className,
      )}
      {...props}
    >
      {initials ? (
        <span className="tracking-tight select-none">{initials}</span>
      ) : (
        <Users
          className={cn("size-1/2 text-primary", iconClassName)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

export interface ClubCoverImageProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  name: string;
  alt?: string;
  variant?: "card" | "header";
  children?: React.ReactNode;
}

/**
 * Robust cover banner component for club cards and club detail pages.
 * Displays the cover photo if valid, or a restrained academic fallback
 * banner matching CampusOS design guidelines.
 */
export function ClubCoverImage({
  src,
  name,
  alt,
  variant = "card",
  className,
  children,
  ...props
}: ClubCoverImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const hasError = failedSrc === src;
  const showImage = isValidImageUrl(src) && !hasError;
  const initials = getClubInitials(name);
  const accessibleAlt = alt || `${name} cover`;

  if (showImage) {
    return (
      <div
        className={cn(
          "relative w-full overflow-hidden bg-muted/30 select-none",
          className,
        )}
        {...props}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src!}
          alt={accessibleAlt}
          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          onError={() => setFailedSrc(src ?? "")}
        />
        {children}
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={accessibleAlt}
      className={cn(
        "relative w-full overflow-hidden select-none",
        "bg-slate-100/90 dark:bg-slate-800/50 border-b border-border/60",
        "flex items-center justify-center",
        className,
      )}
      {...props}
    >
      {variant === "header" ? (
        <div className="flex flex-col items-center justify-center text-center p-4">
          <span className="text-3xl sm:text-4xl font-extrabold text-primary/15 tracking-widest uppercase font-sans select-none">
            {name}
          </span>
        </div>
      ) : (
        <div className="flex items-center justify-center p-4">
          <span className="text-xl font-bold text-primary/20 tracking-wider uppercase font-sans select-none">
            {initials || "CLUB"}
          </span>
        </div>
      )}
      {children}
    </div>
  );
}
