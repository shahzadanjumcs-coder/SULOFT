"use client";

import { MapPin, Calendar, ArrowRight, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Item } from "@/lib/types";
import { FALLBACK_CATEGORIES } from "@/lib/categories";
import { ItemImage } from "./ItemImage";
import { TypeBadge } from "./StatusBadge";
import { formatDate } from "@/lib/format";
import { useSuloft } from "@/lib/store";

interface ItemCardProps {
  item: Item;
  className?: string;
  compact?: boolean;
}

export function ItemCard({ item, className, compact }: ItemCardProps) {
  const navigate = useSuloft((s) => s.navigate);
  const category = FALLBACK_CATEGORIES.find((c) => c.id === item.category_id);

  return (
    <article
      onClick={() => navigate("item", { itemId: item.id })}
      className={cn(
        "group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border bg-card transition-all hover:-translate-y-0.5 hover:shadow-lg hover:border-primary/40",
        className
      )}
    >
      {/* Image area */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        <ItemImage
          title={item.title}
          categoryId={item.category_id}
          type={item.type}
          imageUrl={item.image_url || undefined}
          showBadge
          rounded="none"
          className="h-full w-full transition-transform duration-500 group-hover:scale-105"
        />
        {item.status !== "active" && (
          <span className="absolute right-2 top-2 z-20 rounded-full bg-background/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-foreground shadow-sm backdrop-blur">
            {item.status}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        {category && (
          <span className="mb-2 inline-block w-fit rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
            {category.name}
          </span>
        )}
        <h3 className="font-display text-base font-semibold leading-snug text-foreground line-clamp-2">
          {item.title}
        </h3>
        {!compact && (
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground line-clamp-2">
            {item.description}
          </p>
        )}

        {/* Meta */}
        <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{item.location}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>{formatDate(item.date)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between border-t pt-3">
          <TypeBadge type={item.type} />
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors group-hover:gap-1.5">
            <Eye className="h-3.5 w-3.5" />
            View details
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </article>
  );
}

// Loading skeleton version for skeletons/placeholders
export function ItemCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border bg-card">
      <div className="aspect-[4/3] w-full animate-pulse bg-muted" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
        <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
        <div className="flex justify-between border-t pt-3">
          <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
          <div className="h-5 w-20 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}
