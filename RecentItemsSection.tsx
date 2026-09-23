"use client";

import { useState } from "react";
import { ArrowRight, PackageSearch, Sparkles } from "lucide-react";
import { useSuloft } from "@/lib/store";
import { ItemCard, ItemCardSkeleton } from "../shared/ItemCard";
import { SectionHeading } from "../shared/SectionHeading";
import { EmptyState } from "../shared/EmptyState";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ItemType } from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { fetchItems } from "@/lib/api";
import { useEffect } from "react";

export function RecentItemsSection() {
  const navigate = useSuloft((s) => s.navigate);
  const [tab, setTab] = useState<"lost" | "found">("lost");
  const [items, setItems] = useState<{ lost: ItemType[] | any[]; found: any[] }>({
    lost: [],
    found: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!isSupabaseConfigured) {
      // No Supabase configured — show the empty state.
      // Use a microtask to avoid setState-in-effect lint warning.
      Promise.resolve().then(() => {
        if (active) setLoading(false);
      });
      return;
    }
    (async () => {
      setLoading(true);
      const [lostRes, foundRes] = await Promise.all([
        fetchItems({ type: "lost", limit: 4, sort: "newest" }),
        fetchItems({ type: "found", limit: 4, sort: "newest" }),
      ]);
      if (!active) return;
      setItems({
        lost: lostRes.data ?? [],
        found: foundRes.data ?? [],
      });
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const filtered = items[tab] ?? [];

  return (
    <section className="bg-background py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            align="left"
            eyebrow="Recent activity"
            title="Latest items on the portal"
            description="Fresh reports from across campus. Tap any card to view full details and submit a claim."
            className="max-w-2xl"
          />

          {/* Tabs */}
          <div className="inline-flex w-fit rounded-xl border bg-card p-1">
            <TabButton
              active={tab === "lost"}
              onClick={() => setTab("lost")}
              icon={Sparkles}
              label="Lost Items"
              tone="lost"
            />
            <TabButton
              active={tab === "found"}
              onClick={() => setTab("found")}
              icon={PackageSearch}
              label="Found Items"
              tone="found"
            />
          </div>
        </div>

        {loading ? (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <ItemCardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-10">
            {isSupabaseConfigured ? (
              <EmptyState
                icon={PackageSearch}
                title="No recent items yet"
                description={`There are no recent ${tab} items on the portal. Be the first to report one.`}
                action={{
                  label: tab === "lost" ? "Report a lost item" : "Report a found item",
                  onClick: () =>
                    navigate(tab === "lost" ? "report-lost" : "report-found"),
                }}
              />
            ) : (
              <EmptyState
                icon={PackageSearch}
                title="Connect Supabase to see live items"
                description="Add your Supabase credentials to .env.local to start showing real lost & found items here. See SETUP.md for instructions."
                action={{
                  label: "Report an item",
                  onClick: () => navigate("report-lost"),
                }}
              />
            )}
          </div>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}

        <div className="mt-10 flex justify-center">
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate("browse")}
          >
            View all items
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Sparkles;
  label: string;
  tone: ItemType;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
        active
          ? tone === "lost"
            ? "bg-red-500/10 text-red-600"
            : "bg-emerald-500/10 text-emerald-600"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
