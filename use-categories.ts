"use client";

// SULOFT — useCategories hook
// Fetches categories from Supabase once and caches them in module scope so
// every component gets the same list without duplicate network calls.

import { useEffect, useState } from "react";
import type { Category } from "@/lib/types";
import { fetchCategories } from "@/lib/api";
import { FALLBACK_CATEGORIES } from "@/lib/categories";
import { isSupabaseConfigured } from "@/lib/supabase/client";

let cachedCategories: Category[] | null = null;
let inflight: Promise<Category[]> | null = null;

async function loadCategories(): Promise<Category[]> {
  if (cachedCategories) return cachedCategories;
  if (inflight) return inflight;
  inflight = (async () => {
    const { data, error } = await fetchCategories();
    if (error || !data || data.length === 0) {
      cachedCategories = FALLBACK_CATEGORIES;
    } else {
      cachedCategories = data;
    }
    return cachedCategories;
  })();
  return inflight;
}

export function useCategories(): Category[] {
  const [cats, setCats] = useState<Category[]>(
    cachedCategories ?? FALLBACK_CATEGORIES
  );

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    loadCategories().then((c) => {
      if (active) setCats(c);
    });
    return () => {
      active = false;
    };
  }, []);

  return cats;
}
