"use client";

import { useEffect, useState } from "react";
import {
  Compass,
  Home,
  Info,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  PlusCircle,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSuloft } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import type { ViewKey } from "@/lib/types";

interface NavItem {
  label: string;
  view: ViewKey;
  icon: typeof Home;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Home", view: "home", icon: Home },
  { label: "Browse Items", view: "browse", icon: Compass },
  { label: "Report Lost", view: "report-lost", icon: PlusCircle },
  { label: "Report Found", view: "report-found", icon: Sparkles },
  { label: "About", view: "about", icon: Info },
  { label: "Contact", view: "contact", icon: Info },
];

export function Navbar() {
  const { route, navigate, mobileNavOpen, setMobileNavOpen } = useSuloft();
  const { user, profile, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (view: ViewKey) => navigate(view);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b bg-background/85 backdrop-blur-md transition-shadow",
        scrolled && "shadow-sm"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <button
          onClick={() => go("home")}
          className="group flex items-center gap-3"
          aria-label="SULOFT home"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
            <ShieldCheck className="h-5 w-5" strokeWidth={2.25} />
          </div>
          <div className="text-left leading-tight">
            <div className="font-display text-lg font-bold tracking-tight text-foreground">
              SULOFT
            </div>
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Superior University Okara
            </div>
          </div>
        </button>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) => {
            const active = route.view === item.view;
            return (
              <button
                key={item.view}
                onClick={() => go(item.view)}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => go("browse")}
            className="hidden sm:inline-flex"
          >
            <Search className="h-4 w-4" />
            Search
          </Button>

          {user ? (
            <>
              <Button
                size="sm"
                onClick={() => (profile?.role === "admin" ? go("admin") : go("dashboard"))}
                className="hidden sm:inline-flex"
              >
                <LayoutDashboard className="h-4 w-4" />
                {profile?.role === "admin" ? "Admin" : "Dashboard"}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => signOut()}
                aria-label="Sign out"
                className="hidden sm:inline-flex"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              onClick={() => go("login")}
              className="hidden sm:inline-flex"
            >
              <LogIn className="h-4 w-4" />
              Login
            </Button>
          )}

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Open menu"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
          >
            {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileNavOpen && (
        <div className="lg:hidden border-t bg-background animate-fade-in-down">
          <nav className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
            <ul className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const active = route.view === item.view;
                return (
                  <li key={item.view}>
                    <button
                      onClick={() => go(item.view)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-secondary"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="mt-3 flex flex-col gap-2 border-t pt-3">
              {user ? (
                <>
                  <Button
                    onClick={() =>
                      profile?.role === "admin" ? go("admin") : go("dashboard")
                    }
                    className="w-full"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    {profile?.role === "admin" ? "Admin Dashboard" : "My Dashboard"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => signOut()}
                    className="w-full"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </Button>
                </>
              ) : (
                <Button onClick={() => go("login")} className="w-full">
                  <LogIn className="h-4 w-4" />
                  Login
                </Button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
