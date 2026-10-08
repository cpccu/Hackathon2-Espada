"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Calendar,
  Compass,
  FileText,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  User as UserIcon,
  X,
} from "lucide-react";
import { useAuth } from "@/features/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdminOrResourceAdmin =
    user?.role === "ADMIN" || user?.role === "RESOURCE_ADMIN";

  const navGroups: NavGroup[] = [
    {
      label: "OVERVIEW",
      items: [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      ],
    },
    {
      label: "CAMPUS",
      items: [
        { name: "Events", href: "/events", icon: Calendar },
        { name: "Clubs", href: "/clubs", icon: Compass },
        { name: "Resources", href: "/resources", icon: FileText },
      ],
    },
    ...(isAdminOrResourceAdmin
      ? [
          {
            label: "ADMINISTRATION",
            items: [
              {
                name: "Batch Management",
                href: "/dashboard/batches",
                icon: Layers,
              },
            ],
          },
        ]
      : []),
    {
      label: "ACCOUNT",
      items: [
        { name: "Profile", href: "/profile", icon: UserIcon },
      ],
    },
  ];

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const isItemActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-border bg-card">
        {/* University Brand Header */}
        <div className="flex h-16 items-center px-5 border-b border-border gap-3">
          <Image
            src="/city-university-logo.png"
            alt="City University Logo"
            width={36}
            height={28}
            className="h-8 w-auto object-contain shrink-0"
            priority
          />
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight leading-tight text-foreground">
                CampusOS
              </span>
              <span className="size-1.5 rounded-full bg-[#C62828]" title="City University" />
            </div>
            <span className="text-[11px] font-medium text-muted-foreground truncate leading-none">
              City University
            </span>
          </div>
        </div>

        {/* Grouped Sidebar Navigation */}
        <nav className="flex-1 space-y-6 px-3 py-4 overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.label} className="space-y-1">
              <div className="px-3 pb-1.5 text-[10px] font-bold text-muted-foreground/75 tracking-wider uppercase">
                {group.label}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isItemActive(item.href);

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <Icon className={cn("size-4 shrink-0", active ? "text-primary-foreground" : "text-muted-foreground")} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Card & Logout / Sign In */}
        <div className="p-3 border-t border-border bg-card">
          {user ? (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border/70 bg-muted/30 hover:bg-muted/50 transition-colors">
              <Link
                href="/profile"
                className="flex items-center gap-2.5 min-w-0 flex-1 group"
                title="View Profile"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow-2xs">
                  {getInitials(user.name)}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate">
                    {user.role}
                  </span>
                </div>
              </Link>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => logout()}
                title="Sign out"
                aria-label="Sign out"
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer rounded-md"
              >
                <LogOut className="size-3.5" />
              </Button>
            </div>
          ) : (
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "w-full justify-center text-xs font-medium cursor-pointer shadow-2xs",
              )}
            >
              Sign In
            </Link>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 md:pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-card px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? (
                <X className="size-5" />
              ) : (
                <Menu className="size-5" />
              )}
            </Button>
            <div className="flex items-center gap-2 md:hidden">
              <Image
                src="/city-university-logo.png"
                alt="City University Logo"
                width={26}
                height={20}
                className="h-6 w-auto object-contain shrink-0"
              />
              <span className="text-sm font-semibold">CampusOS</span>
            </div>
            <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">City University</span>
              <span className="text-border">•</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0B1F3A] text-[11px] font-medium border border-blue-100">
                <span className="size-1.5 rounded-full bg-[#2563EB]" />
                Official Academic Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link
                  href="/profile"
                  className="hidden sm:inline-block text-xs text-muted-foreground hover:text-foreground transition-colors"
                  title="View Profile"
                >
                  {user.email}
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => logout()}
                  className="gap-2 text-xs cursor-pointer"
                >
                  <LogOut className="size-3.5" />
                  <span>Logout</span>
                </Button>
              </>
            ) : (
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "text-xs cursor-pointer",
                )}
              >
                Sign In
              </Link>
            )}
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-border bg-card px-4 py-3 space-y-4 shadow-sm animate-in fade-in-50">
            {navGroups.map((group) => (
              <div key={group.label} className="space-y-1">
                <div className="px-2 text-[10px] font-bold text-muted-foreground/75 uppercase tracking-wider">
                  {group.label}
                </div>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isItemActive(item.href);
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          active
                            ? "bg-primary text-primary-foreground font-semibold"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        <Icon className="size-4 shrink-0" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Page Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
