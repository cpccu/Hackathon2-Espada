"use client";

import React from "react";
import { useAuth } from "@/features/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Calendar,
  Compass,
  FileText,
  User as UserIcon,
} from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DashboardOverview() {
  const { user } = useAuth();

  const departmentDisplay = user?.department
    ? user.department.code &&
      user.department.name.toLowerCase().includes(`(${user.department.code.toLowerCase()})`)
      ? user.department.name
      : user.department.code
        ? `${user.department.name} (${user.department.code})`
        : user.department.name
    : null;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Welcome Banner */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="relative z-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0B1F3A] text-xs font-semibold border border-blue-100">
              <span className="size-1.5 rounded-full bg-[#C62828]" />
              City University • CampusOS
            </span>
            <Badge variant="outline" className="text-xs font-medium border-border/80 text-muted-foreground">
              {user?.role || "STUDENT"}
            </Badge>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Welcome back, {user?.name || "Student"}! 👋
          </h1>

          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            You are logged in as a{" "}
            <span className="font-semibold text-foreground">{user?.role}</span>
            {departmentDisplay && (
              <span> in <strong className="font-semibold text-foreground">{departmentDisplay}</strong></span>
            )}
            . Access university notices, course resources, club activities, and campus workshops in one place.
          </p>
        </div>
      </div>

      {/* Quick Statistics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Link
          href="/events"
          className="group rounded-xl border border-border bg-card p-4 shadow-2xs hover:border-primary/40 hover:shadow-xs transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Events</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-50 text-primary border border-blue-100">
              <Calendar className="size-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-lg font-bold text-foreground">Workshops & Talks</span>
            <ArrowRight className="size-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </div>
        </Link>

        <Link
          href="/clubs"
          className="group rounded-xl border border-border bg-card p-4 shadow-2xs hover:border-primary/40 hover:shadow-xs transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Societies</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-50 text-primary border border-blue-100">
              <Compass className="size-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-lg font-bold text-foreground">Student Clubs</span>
            <ArrowRight className="size-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </div>
        </Link>

        <Link
          href="/resources"
          className="group rounded-xl border border-border bg-card p-4 shadow-2xs hover:border-primary/40 hover:shadow-xs transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Academic Hub</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-50 text-primary border border-blue-100">
              <FileText className="size-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-lg font-bold text-foreground">Lecture Notes & Papers</span>
            <ArrowRight className="size-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </div>
        </Link>

        <Link
          href="/profile"
          className="group rounded-xl border border-border bg-card p-4 shadow-2xs hover:border-primary/40 hover:shadow-xs transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Account</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-50 text-primary border border-blue-100">
              <UserIcon className="size-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-lg font-bold text-foreground">{user?.studentId || "Profile Details"}</span>
            <ArrowRight className="size-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </div>
        </Link>
      </div>

      {/* Feature Modules Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground tracking-tight">
            Campus Ecosystem
          </h2>
          <span className="text-xs text-muted-foreground">
            City University Integrated Services
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Events Card */}
          <Card className="hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between">
            <CardHeader className="space-y-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-primary border border-blue-100 shadow-2xs">
                <Calendar className="size-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">Events & Workshops</CardTitle>
                <CardDescription className="mt-1 leading-relaxed">
                  Discover upcoming campus hackathons, technical seminars, and book entry passes.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Link
                href="/events"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full cursor-pointer justify-between group")}
              >
                <span>Browse Events</span>
                <ArrowRight className="size-3.5 text-muted-foreground group-hover:translate-x-0.5 group-hover:text-foreground transition-transform" />
              </Link>
            </CardContent>
          </Card>

          {/* Clubs Card */}
          <Card className="hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between">
            <CardHeader className="space-y-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-primary border border-blue-100 shadow-2xs">
                <Compass className="size-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">Clubs & Societies</CardTitle>
                <CardDescription className="mt-1 leading-relaxed">
                  Join university student clubs, discover executive teams, and read announcements.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Link
                href="/clubs"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full cursor-pointer justify-between group")}
              >
                <span>Explore Clubs</span>
                <ArrowRight className="size-3.5 text-muted-foreground group-hover:translate-x-0.5 group-hover:text-foreground transition-transform" />
              </Link>
            </CardContent>
          </Card>

          {/* Resource Hub Card */}
          <Card className="hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between">
            <CardHeader className="space-y-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-primary border border-blue-100 shadow-2xs">
                <FileText className="size-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">Academic Resource Hub</CardTitle>
                <CardDescription className="mt-1 leading-relaxed">
                  Organized by department, semester, and section for fast access to course materials.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Link
                href="/resources"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full cursor-pointer justify-between group")}
              >
                <span>Browse Resources</span>
                <ArrowRight className="size-3.5 text-muted-foreground group-hover:translate-x-0.5 group-hover:text-foreground transition-transform" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
