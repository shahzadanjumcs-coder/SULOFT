"use client";

import { ArrowUpRight, TrendingUp, Users, Package, CheckCircle2 } from "lucide-react";
import { SectionHeading } from "../shared/SectionHeading";
import { usePortalStats } from "@/lib/use-portal-stats";

// =============================================================================
// SULOFT — Portal impact stats
// -----------------------------------------------------------------------------
// All numbers are REAL — fetched live from Supabase via `usePortalStats()`.
// No hardcoded marketing numbers. When the portal has no data, all stats
// display "0" (honest empty state).
//
// RLS implications:
//   • Anon visitors only see counts of rows they're authorised to read.
//   • `activeItems` is fully public (RLS allows anon to read active items).
//   • `returnedItems`, `totalProfiles` are hidden from anon — those cards
//     will show 0 for unauthenticated visitors, which is honest from their
//     perspective.
// =============================================================================

export function StatsSection() {
  const { activeItems, returnedItems, totalProfiles, recoveryRate, loading } =
    usePortalStats();

  const STATS = [
    {
      icon: Package,
      label: "Items Reported",
      value: loading ? "…" : formatCount(activeItems + returnedItems),
      delta: "Live count",
      color: "text-emerald-600",
    },
    {
      icon: CheckCircle2,
      label: "Items Returned",
      value: loading ? "…" : formatCount(returnedItems),
      delta: "Live count",
      color: "text-primary",
    },
    {
      icon: Users,
      label: "Active Members",
      value: loading ? "…" : formatCount(totalProfiles),
      delta: "Live count",
      color: "text-blue-600",
    },
    {
      icon: TrendingUp,
      label: "Recovery Rate",
      value: loading ? "…" : `${recoveryRate}%`,
      delta: "Derived from live data",
      color: "text-amber-600",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-primary py-20 text-primary-foreground">
      <div className="absolute inset-0 bg-grid opacity-10" aria-hidden />
      <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary-foreground/10 blur-3xl" aria-hidden />
      <div className="absolute -left-32 -bottom-32 h-96 w-96 rounded-full bg-primary-foreground/10 blur-3xl" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <span className="inline-block rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
            Portal impact
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Trusted by the campus community
          </h2>
          <p className="mt-3 text-base leading-relaxed text-primary-foreground/80">
            Live numbers from the SULOFT portal — every count below is fetched
            directly from the database in real time. No marketing placeholders.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              className="rounded-2xl bg-primary-foreground/10 p-6 backdrop-blur transition-colors hover:bg-primary-foreground/15 animate-fade-in-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <stat.icon className="h-7 w-7 opacity-80" strokeWidth={1.75} />
              <div className="mt-4 flex items-baseline gap-1">
                <div className="font-display text-4xl font-bold">
                  {stat.value}
                </div>
              </div>
              <div className="mt-1 text-sm font-medium">{stat.label}</div>
              <div className="mt-2 inline-flex items-center gap-1 text-xs opacity-70">
                <ArrowUpRight className="h-3 w-3" />
                {stat.delta}
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
