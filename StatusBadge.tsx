"use client";

import { cn } from "@/lib/utils";
import type { ClaimStatus, ItemStatus, ItemType } from "@/lib/types";

export function TypeBadge({
  type,
  className,
}: {
  type: ItemType;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
        type === "lost"
          ? "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300"
          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
        className
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          type === "lost" ? "bg-red-500" : "bg-emerald-500"
        )}
      />
      {type}
    </span>
  );
}

const STATUS_STYLES: Record<ItemStatus, { label: string; cls: string }> = {
  active: {
    label: "Active",
    cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  claimed: {
    label: "Claimed",
    cls: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  },
  returned: {
    label: "Returned",
    cls: "bg-primary/10 text-primary",
  },
  expired: {
    label: "Expired",
    cls: "bg-muted text-muted-foreground",
  },
  removed: {
    label: "Removed",
    cls: "bg-muted text-muted-foreground",
  },
};

export function StatusBadge({ status }: { status: ItemStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        s.cls
      )}
    >
      {s.label}
    </span>
  );
}

const CLAIM_STYLES: Record<ClaimStatus, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  approved:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  completed: "bg-primary/10 text-primary",
};

export function ClaimStatusBadge({ status }: { status: ClaimStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        CLAIM_STYLES[status]
      )}
    >
      {status}
    </span>
  );
}
