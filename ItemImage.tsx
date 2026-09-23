"use client";

import { createElement } from "react";
import { cn } from "@/lib/utils";
import { getIcon } from "@/lib/icons";
import { FALLBACK_CATEGORIES } from "@/lib/categories";

interface ItemImageProps {
  title: string;
  categoryId?: string;
  type?: "lost" | "found";
  imageUrl?: string;
  className?: string;
  rounded?: "lg" | "xl" | "2xl" | "full" | "none";
  showBadge?: boolean;
}

// Deterministic pastel background generator — same title => same color
function colorFromString(str: string): { bg: string; fg: string } {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  const isLost = str.toLowerCase().includes("lost");
  const isFound = str.toLowerCase().includes("found");
  const finalHue = isLost ? 12 : isFound ? 152 : hue;
  return {
    bg: `hsl(${finalHue}, 70%, 94%)`,
    fg: `hsl(${finalHue}, 50%, 32%)`,
  };
}

// Helper component so we don't create a component inside render
function DynamicIcon({
  name,
  className,
  strokeWidth,
  style,
}: {
  name?: string;
  className?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
}) {
  return createElement(getIcon(name), {
    className,
    strokeWidth,
    style,
  });
}

export function ItemImage({
  title,
  categoryId,
  type,
  imageUrl,
  className,
  rounded = "lg",
  showBadge = false,
}: ItemImageProps) {
  const cat = FALLBACK_CATEGORIES.find((c) => c.id === categoryId);
  const { bg, fg } = colorFromString(title + (cat?.name ?? ""));
  const roundedClass = {
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
    full: "rounded-full",
    none: "",
  }[rounded];

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden",
        roundedClass,
        className
      )}
      style={{ background: bg }}
      aria-label={`Image for ${title}`}
    >
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.5), transparent 40%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.3), transparent 40%)",
        }}
      />
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={title}
          className="relative z-10 h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div
          className="relative z-10 flex flex-col items-center gap-3"
          style={{ color: fg }}
        >
          <DynamicIcon
            name={cat?.icon}
            className="h-12 w-12 opacity-90"
            strokeWidth={1.5}
          />
          <span className="text-xs font-medium tracking-wide uppercase opacity-70">
            {cat?.name ?? "Item"}
          </span>
        </div>
      )}
      {showBadge && type && (
        <span
          className={cn(
            "absolute left-2 top-2 z-20 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide shadow-sm",
            type === "lost"
              ? "bg-red-100 text-red-700"
              : "bg-emerald-100 text-emerald-700"
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
      )}
    </div>
  );
}
