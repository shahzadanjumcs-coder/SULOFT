// SULOFT — Global UI Store (Zustand)
// -----------------------------------------------------------------------------
// Pure UI state only: navigation, mobile menu, and optimistic data that is
// refreshed from Supabase after mutations.
//
// NOTE: Authentication has moved to `src/lib/auth-context.tsx`, which uses the
// REAL Supabase Auth API. This store no longer holds the session or any user
// object. Components that need the current user use `useAuth()` instead.
// -----------------------------------------------------------------------------

"use client";

import { create } from "zustand";
import type { ViewKey } from "./types";

export interface ViewState {
  view: ViewKey;
  itemId?: string;
  dashboardTab?: string;
  adminTab?: string;
}

interface SuloftState {
  // ---- navigation ----
  route: ViewState;
  navigate: (view: ViewKey, opts?: Partial<ViewState>) => void;

  // ---- ui ----
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;

  // ---- optimistic refresh counter ----
  // Bumped after any mutation so list pages can refetch.
  dataVersion: number;
  bumpDataVersion: () => void;
}

export const useSuloft = create<SuloftState>((set) => ({
  route: { view: "home" },
  navigate: (view, opts) =>
    set((s) => ({
      route: { ...s.route, ...opts, view },
      mobileNavOpen: false,
    })),

  mobileNavOpen: false,
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),

  dataVersion: 0,
  bumpDataVersion: () =>
    set((s) => ({ dataVersion: s.dataVersion + 1 })),
}));
