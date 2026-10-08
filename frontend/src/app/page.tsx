import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/config/site";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Application shell for the root route.
 * Product screens live under their feature directories and are added later.
 */
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-screen-xl flex-1 flex-col items-center justify-center px-4 py-16 sm:py-24 text-center sm:px-6 lg:px-8">
      <div className="mb-6 flex justify-center">
        <Image
          src="/city-university-logo.png"
          alt="City University Logo"
          width={96}
          height={72}
          className="h-20 w-auto object-contain drop-shadow-2xs"
          priority
        />
      </div>

      <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#0B1F3A] text-xs font-semibold border border-blue-100 shadow-2xs">
        <span className="size-1.5 rounded-full bg-[#C62828]" />
        <span>City University • Digital Campus Platform</span>
      </div>

      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
        {siteConfig.name}
      </h1>
      <p className="mt-4 max-w-md text-sm text-muted-foreground sm:max-w-xl sm:text-base leading-relaxed">
        {siteConfig.description}
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/login"
          className={cn(buttonVariants({ size: "lg" }), "h-11 px-6 font-semibold cursor-pointer shadow-xs")}
        >
          Sign In
        </Link>
        <Link
          href="/register"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "h-11 px-6 font-medium cursor-pointer bg-card hover:bg-muted shadow-2xs",
          )}
        >
          Student Registration
        </Link>
      </div>

      {/* Feature Highlights Strip */}
      <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl w-full text-left">
        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
          <div className="text-xs font-bold text-foreground">Academic Resource Hub</div>
          <p className="text-[11px] text-muted-foreground mt-1">Organized by Department, Semester, and Section.</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
          <div className="text-xs font-bold text-foreground">Campus Events & Tickets</div>
          <p className="text-[11px] text-muted-foreground mt-1">Instant RSVP and secure QR code admission passes.</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
          <div className="text-xs font-bold text-foreground">Clubs & Societies</div>
          <p className="text-[11px] text-muted-foreground mt-1">Connect with active student societies and activities.</p>
        </div>
      </div>
    </main>
  );
}
