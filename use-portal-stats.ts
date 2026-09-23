"use client";

// SULOFT — usePortalStats
// -----------------------------------------------------------------------------
// Fetches REAL aggregate counts from Supabase. No hardcoded fake numbers.
//
// Counts returned are subject to Row Level Security:
//   • activeItems    — anyone (anon + authenticated) can count active items
//   • returnedItems  — anon sees 0 (RLS hides returned items from non-owners);
//                      logged-in users see their own returned items;
//                      admins see all
//   • totalProfiles  — anon sees 0 (RLS hides profiles from non-owners);
//                      admins see all
//   • recoveryRate   — derived from (returnedItems / (returnedItems + activeItems))
//
// When the portal is fresh and there's no data, all counts will be 0.
// This is the correct empty state — we never display fake numbers.
// -----------------------------------------------------------------------------

import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";

export interface PortalStats {
  activeItems: number;
  returnedItems: number;
  totalProfiles: number;
  recoveryRate: number; // 0..100
  loading: boolean;
}

let cachedStats: PortalStats | null = null;
let inflight: Promise<PortalStats> | null = null;

async function fetchStats(): Promise<PortalStats> {
  if (!isSupabaseConfigured) {
    return {
      activeItems: 0,
      returnedItems: 0,
      totalProfiles: 0,
      recoveryRate: 0,
      loading: false,
    };
  }

  // Use head:true with count:'exact' so we don't transfer any rows — just the
  // count from the database. RLS applies to the count, so anon users will
  // only see counts of rows they're authorised to read.
  const [activeRes, returnedRes, profilesRes] = await Promise.all([
    supabase
      .from("items")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("items")
      .select("*", { count: "exact", head: true })
      .eq("status", "returned"),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true }),
  ]);

  const activeItems = activeRes.count ?? 0;
  const returnedItems = returnedRes.count ?? 0;
  const totalProfiles = profilesRes.count ?? 0;
  const denominator = activeItems + returnedItems;
  const recoveryRate =
    denominator > 0 ? Math.round((returnedItems / denominator) * 100) : 0;

  return {
    activeItems,
    returnedItems,
    totalProfiles,
    recoveryRate,
    loading: false,
  };
}

async function loadStats(): Promise<PortalStats> {
  if (cachedStats) return cachedStats;
  if (inflight) return inflight;
  inflight = (async () => {
    const s = await fetchStats();
    cachedStats = s;
    return s;
  })();
  return inflight;
}

export function usePortalStats(): PortalStats {
  const [stats, setStats] = useState<PortalStats>(
    cachedStats ?? {
      activeItems: 0,
      returnedItems: 0,
      totalProfiles: 0,
      recoveryRate: 0,
      loading: true,
    }
  );

  useEffect(() => {
    if (!isSupabaseConfigured) {
      Promise.resolve().then(() => {
        setStats({
          activeItems: 0,
          returnedItems: 0,
          totalProfiles: 0,
          recoveryRate: 0,
          loading: false,
        });
      });
      return;
    }
    let active = true;
    loadStats().then((s) => {
      if (active) setStats(s);
    });
    return () => {
      active = false;
    };
  }, []);

  return stats;
}

// Bust the cache after mutations (item created, claim approved, item returned).
// Call this from any component that mutates the underlying data so the next
// reader of usePortalStats sees fresh numbers.
export function bustPortalStatsCache(): void {
  cachedStats = null;
  inflight = null;
}
