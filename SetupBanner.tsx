"use client";

import { useState } from "react";
import { AlertCircle, BookOpen, X } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useSuloft } from "@/lib/store";

/**
 * Shows a dismissible banner at the top of the app when Supabase
 * environment variables are not configured.
 *
 * `isSupabaseConfigured` is a build-time / startup-time constant — env vars
 * don't change at runtime in production — so we can safely initialise the
 * `visible` state once from it without an effect.
 */
export function SetupBanner() {
  const navigate = useSuloft((s) => s.navigate);
  const [dismissed, setDismissed] = useState(false);
  const [visible] = useState(() => !isSupabaseConfigured);

  if (!visible || dismissed) return null;

  return (
    <div className="sticky top-0 z-[100] w-full border-b border-amber-300/50 bg-amber-50 text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
      <div className="mx-auto flex max-w-7xl items-start gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="flex-1 text-sm">
          <strong className="font-semibold">Supabase not configured.</strong>{" "}
          You&apos;re seeing the UI in a degraded state. Add your Supabase
          credentials to <code className="font-mono">.env.local</code> — see
          the setup instructions.
          <button
            onClick={() => navigate("contact")}
            className="ml-2 inline-flex items-center gap-1 font-medium underline underline-offset-2 hover:text-primary"
          >
            <BookOpen className="h-3 w-3" />
            View setup help
          </button>
        </div>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss banner"
          className="rounded p-1 hover:bg-amber-100 dark:hover:bg-amber-500/20"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
