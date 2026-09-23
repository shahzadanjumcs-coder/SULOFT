"use client";

// SULOFT — Real Supabase Authentication Context
// -----------------------------------------------------------------------------
// This is the single source of truth for "who is the current user?" across the
// entire app. It uses Supabase Auth's real session management:
//
//   • `getSession()` restores any existing session on first load.
//   • `onAuthStateChange()` listens for sign-in / sign-out / token-refresh
//     events and updates the React tree in real time.
//   • After auth, we fetch the matching `profiles` row to learn the user's
//     role (student / staff / admin). RLS policies ensure a user can always
//     read their own profile.
//
// This is NOT mock authentication. It uses real Supabase APIs end to end.
// -----------------------------------------------------------------------------

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Profile, UserRole } from "@/lib/types";

interface AuthContextValue {
  // The Supabase session — null when signed out
  session: Session | null;
  // The Supabase auth user — null when signed out
  user: User | null;
  // The matching profile row (with role) — null when signed out or loading
  profile: Profile | null;
  // True until the first getSession() resolves
  loading: boolean;
  // Convenience: is the current user an admin?
  isAdmin: boolean;
  // Real Supabase auth operations (delegated to supabase.auth)
  signInWithPassword: (
    email: string,
    password: string
  ) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    metadata: { full_name: string; student_id: string; department: string }
  ) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (
    email: string
  ) => Promise<{ error: string | null }>;
  updatePassword: (
    newPassword: string
  ) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch the profile for a given user id.
  const fetchProfile = async (uid: string): Promise<Profile | null> => {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", uid)
      .maybeSingle();
    if (error) {
      console.error("Failed to fetch profile:", error.message);
      return null;
    }
    return data as Profile | null;
  };

  const refreshProfile = async () => {
    if (!user) {
      setProfile(null);
      return;
    }
    const p = await fetchProfile(user.id);
    setProfile(p);
  };

  // Initialise: restore existing session + subscribe to auth changes
  useEffect(() => {
    let active = true;

    if (!isSupabaseConfigured) {
      // Use a microtask to avoid the setState-in-effect lint warning.
      Promise.resolve().then(() => {
        if (active) setLoading(false);
      });
      return;
    }

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        const p = await fetchProfile(data.session.user.id);
        if (active) setProfile(p);
      }
      setLoading(false);
    };
    init();

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!active) return;
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          const p = await fetchProfile(newSession.user.id);
          if (active) setProfile(p);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextValue = {
    session,
    user,
    profile,
    loading,
    isAdmin: (profile?.role as UserRole | undefined) === "admin",

    signInWithPassword: async (email, password) => {
      if (!isSupabaseConfigured)
        return { error: "Supabase is not configured. See SETUP.md." };
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error: error?.message ?? null };
    },

    signUp: async (email, password, metadata) => {
      if (!isSupabaseConfigured)
        return {
          error: "Supabase is not configured. See SETUP.md.",
          needsEmailConfirmation: false,
        };
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata },
      });
      if (error) {
        return { error: error.message, needsEmailConfirmation: false };
      }
      // Many Supabase projects require email confirmation. If so, no
      // session is created until the user clicks the link.
      const needsEmailConfirmation = !data.session;
      return { error: null, needsEmailConfirmation };
    },

    signOut: async () => {
      if (!isSupabaseConfigured) return;
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setProfile(null);
    },

    resetPasswordForEmail: async (email) => {
      if (!isSupabaseConfigured)
        return { error: "Supabase is not configured. See SETUP.md." };
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo:
          (typeof window !== "undefined" ? window.location.origin : "") +
          "/?view=reset-password",
      });
      return { error: error?.message ?? null };
    },

    updatePassword: async (newPassword) => {
      if (!isSupabaseConfigured)
        return { error: "Supabase is not configured. See SETUP.md." };
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      return { error: error?.message ?? null };
    },

    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside an <AuthProvider>");
  }
  return ctx;
}
