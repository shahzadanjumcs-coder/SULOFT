"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  PackageSearch,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useSuloft } from "@/lib/store";
import { useCategories } from "@/lib/use-categories";
import { campusLocations } from "@/lib/mock-data";
import { fetchItems, type ItemQueryFilters } from "@/lib/api";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { ItemCard, ItemCardSkeleton } from "../shared/ItemCard";
import { EmptyState } from "../shared/EmptyState";
import type { ItemType } from "@/lib/types";

const ITEMS_PER_PAGE = 9;
type TypeFilter = "all" | ItemType;
type SortKey = "newest" | "oldest" | "title";

export function BrowsePage() {
  const categories = useCategories();
  const bumpDataVersion = useSuloft((s) => s.bumpDataVersion);
  const dataVersion = useSuloft((s) => s.dataVersion);

  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [type, setType] = useState<TypeFilter>("all");
  const [category, setCategory] = useState<string>("all");
  const [location, setLocation] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const filters: ItemQueryFilters = useMemo(
    () => ({
      search,
      type: type === "all" ? undefined : type,
      categoryId: category,
      location,
      sort,
      limit: ITEMS_PER_PAGE,
      offset: (page - 1) * ITEMS_PER_PAGE,
    }),
    [search, type, category, location, sort, page]
  );

  useEffect(() => {
    let active = true;
    if (!isSupabaseConfigured) {
      // No Supabase configured — show the "connect Supabase" empty state.
      // Use a microtask to avoid setState-in-effect lint warning.
      Promise.resolve().then(() => {
        if (active) {
          setLoading(false);
          setItems([]);
        }
      });
      return;
    }
    (async () => {
      setLoading(true);
      setError(null);
      const { data, count, error } = await fetchItems(filters);
      if (!active) return;
      if (error) {
        setError(error);
        setItems([]);
      } else {
        setItems(data ?? []);
        setTotal(count ?? 0);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [JSON.stringify(filters), dataVersion]);

  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);

  const activeFilterCount =
    (type !== "all" ? 1 : 0) +
    (category !== "all" ? 1 : 0) +
    (location !== "all" ? 1 : 0);

  const clearAll = () => {
    setType("all");
    setCategory("all");
    setLocation("all");
    setSearch("");
    setPage(1);
  };

  return (
    <div className="animate-fade-in">
      {/* Page header */}
      <section className="border-b bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Browse Items
            </span>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              All lost & found items on campus
            </h1>
            <p className="max-w-2xl text-pretty text-muted-foreground">
              Search and filter through every active listing. Found something that&apos;s yours? Submit a claim directly from the item details page.
            </p>
          </div>

          {/* Search */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by name, description, or location…"
                className="h-11 pl-10"
                aria-label="Search items"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters((v) => !v)}
              className="h-11 sm:w-auto"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>

          {/* Inline quick type filter */}
          <div className="mt-4 inline-flex w-fit rounded-xl border bg-card p-1">
            {(["all", "lost", "found"] as TypeFilter[]).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setType(t);
                  setPage(1);
                }}
                className={cn(
                  "rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-colors",
                  type === t
                    ? t === "lost"
                      ? "bg-red-500/10 text-red-600"
                      : t === "found"
                        ? "bg-emerald-500/10 text-emerald-600"
                        : "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t === "all" ? "All items" : `${t} items`}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Filters panel */}
      {showFilters && (
        <div className="border-b bg-card animate-fade-in-down">
          <div className="mx-auto flex max-w-7xl flex-wrap items-end gap-4 px-4 py-5 sm:px-6 lg:px-8">
            <FilterField label="Category">
              <Select
                value={category}
                onValueChange={(v) => {
                  setCategory(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>

            <FilterField label="Location">
              <Select
                value={location}
                onValueChange={(v) => {
                  setLocation(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All locations</SelectItem>
                  {campusLocations.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>

            <FilterField label="Sort by">
              <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                  <SelectItem value="title">Title (A–Z)</SelectItem>
                </SelectContent>
              </Select>
            </FilterField>

            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="text-muted-foreground"
              >
                <X className="h-3.5 w-3.5" />
                Clear all filters
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      <section className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Result count + filter reminder */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
            <p>
              {loading ? (
                "Loading items…"
              ) : (
                <>
                  Showing{" "}
                  <span className="font-semibold text-foreground">
                    {items.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-foreground">{total}</span>{" "}
                  {total === 1 ? "item" : "items"}
                </>
              )}
            </p>
            {activeFilterCount > 0 && !showFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="h-7"
              >
                <Filter className="h-3.5 w-3.5" />
                Reset filters
              </Button>
            )}
          </div>

          {error ? (
            <EmptyState
              icon={PackageSearch}
              title="Could not load items"
              description={error}
              action={{
                label: "Try again",
                onClick: () => bumpDataVersion(),
              }}
            />
          ) : !isSupabaseConfigured ? (
            <EmptyState
              icon={PackageSearch}
              title="Connect Supabase to browse items"
              description="Add your Supabase credentials to .env.local to start showing real lost & found items. See SETUP.md for instructions."
              action={{
                label: "Report a lost item",
                onClick: () => useSuloft.getState().navigate("report-lost"),
              }}
            />
          ) : loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <ItemCardSkeleton key={i} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title="No items match your search"
              description="Try adjusting your filters or search term. If you can't find what you're looking for, consider reporting it so others can help."
              action={{
                label: "Report a lost item",
                onClick: () => useSuloft.getState().navigate("report-lost"),
              }}
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && !loading && (
            <div className="mt-10 flex flex-col items-center gap-3">
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: totalPages }).map((_, i) => {
                  const p = i + 1;
                  const isCurrent = p === safePage;
                  if (p === 1 || p === totalPages || Math.abs(p - safePage) <= 1) {
                    return (
                      <Button
                        key={p}
                        variant={isCurrent ? "default" : "outline"}
                        size="icon"
                        onClick={() => setPage(p)}
                        aria-current={isCurrent ? "page" : undefined}
                      >
                        {p}
                      </Button>
                    );
                  }
                  if (
                    (p === safePage - 2 || p === safePage + 2) &&
                    p !== 1 &&
                    p !== totalPages
                  ) {
                    return (
                      <span
                        key={p}
                        className="px-1 text-muted-foreground"
                        aria-hidden
                      >
                        …
                      </span>
                    );
                  }
                  return null;
                })}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Page {safePage} of {totalPages}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

export function BrowsePageSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-32 bg-muted" />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <ItemCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
