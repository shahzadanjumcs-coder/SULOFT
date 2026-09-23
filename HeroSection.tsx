"use client";

import { useState } from "react";
import {
  ArrowRight,
  PackageSearch,
  Search,
  Sparkles,
  TrendingUp,
  Users,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSuloft } from "@/lib/store";
import { usePortalStats } from "@/lib/use-portal-stats";

export function HeroSection() {
  const navigate = useSuloft((s) => s.navigate);
  const [query, setQuery] = useState("");
  const { activeItems, returnedItems, totalProfiles, recoveryRate, loading } =
    usePortalStats();

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("browse", { ...(query ? {} : {}) });
    // Note: query is read by Browse page from URL hash state — for now, navigate.
  };

  return (
    <section className="relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-grid opacity-60" aria-hidden />
      <div className="absolute inset-0 bg-radial-fade" aria-hidden />
      <div className="absolute -top-24 right-0 h-96 w-96 rounded-full bg-primary/5 blur-3xl" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-3xl text-center">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 rounded-full border bg-card/60 px-3 py-1 text-xs font-medium text-primary backdrop-blur">
            <span className="flex h-1.5 w-1.5">
              <span className="h-1.5 w-1.5 animate-ping rounded-full bg-primary opacity-75" />
              <span className="absolute h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            Live · Superior University Okara Lost & Found Portal
          </div>

          {/* Headline */}
          <h1 className="mt-6 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl text-balance">
            Lost Something?
            <br />
            <span className="text-primary">Let&apos;s Help You Find It.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
            SULOFT connects students and staff across the Superior University Okara campus. Report a lost item, share something you found, and safely return belongings to their owners.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              onClick={() => navigate("report-lost")}
              className="w-full sm:w-auto"
            >
              <Sparkles className="h-4 w-4" />
              Report Lost Item
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("report-found")}
              className="w-full sm:w-auto"
            >
              <PackageSearch className="h-4 w-4" />
              Report Found Item
            </Button>
          </div>

          {/* Search bar */}
          <form onSubmit={onSearch} className="mx-auto mt-10 max-w-2xl">
            <div className="relative flex items-center gap-2 rounded-2xl border bg-card p-2 shadow-sm focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/15">
              <Search className="ml-2 h-5 w-5 shrink-0 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for items, locations, or categories — e.g. 'black wallet' or 'library'"
                className="h-11 flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                aria-label="Search items"
              />
              <Button type="submit" size="lg" className="h-11">
                Search
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
              <span>Try:</span>
              {["Wallet", "Phone", "Library", "Calculator"].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setQuery(tag);
                    navigate("browse");
                  }}
                  className="rounded-full border bg-card px-2.5 py-1 transition-colors hover:border-primary/40 hover:text-primary"
                >
                  {tag}
                </button>
              ))}
            </div>
          </form>
        </div>

        {/* Live stats ribbon — REAL counts from Supabase */}
        <div className="mt-16 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              icon: PackageSearch,
              label: "Active Items",
              value: loading ? "…" : formatCount(activeItems),
            },
            {
              icon: CheckCircle2,
              label: "Returned",
              value: loading ? "…" : formatCount(returnedItems),
            },
            {
              icon: Users,
              label: "Active Members",
              value: loading ? "…" : formatCount(totalProfiles),
            },
            {
              icon: TrendingUp,
              label: "Recovery Rate",
              value: loading ? "…" : `${recoveryRate}%`,
            },
          ].map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-3 rounded-2xl border bg-card/80 px-4 py-3 backdrop-blur"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <s.icon className="h-4.5 w-4.5" strokeWidth={1.75} />
              </div>
              <div>
                <div className="font-display text-xl font-bold leading-none">
                  {s.value}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {s.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function formatCount(n: number): string {
  if (n >= 1000) {
    return new Intl.NumberFormat("en-US").format(n);
  }
  return String(n);
}
