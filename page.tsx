"use client";

import { useEffect } from "react";
import { useSuloft } from "@/lib/store";
import { AppShell } from "@/components/suloft/layout/AppShell";
import { HomePage } from "@/components/suloft/home/HomePage";
import { BrowsePage } from "@/components/suloft/browse/BrowsePage";
import { ItemDetailsPage } from "@/components/suloft/item/ItemDetailsPage";
import { ReportForm } from "@/components/suloft/report/ReportForm";
import { AuthPage } from "@/components/suloft/auth/AuthPage";
import { UserDashboardPage } from "@/components/suloft/dashboard/UserDashboardPage";
import { AdminDashboardPage } from "@/components/suloft/dashboard/AdminDashboardPage";
import { AboutPage } from "@/components/suloft/about/AboutPage";
import { ContactPage } from "@/components/suloft/about/ContactPage";

export default function Home() {
  const { route, navigate } = useSuloft();

  // Scroll to top whenever the view changes — gives a real "page" feel.
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [route.view, route.itemId]);

  // Detect Supabase password-recovery redirect on initial load.
  // When a user clicks the reset link in the email, Supabase redirects to
  // the app with a `type=recovery` query string (or hash) and a temporary
  // session. We auto-route them to the reset-password view so they can set
  // a new password immediately.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const isRecovery =
      url.searchParams.get("type") === "recovery" ||
      url.hash.includes("type=recovery") ||
      url.hash.includes("type=signup");
    if (isRecovery) {
      navigate("reset-password");
      // Clean the URL so a refresh doesn't re-trigger the route.
      window.history.replaceState({}, document.title, url.pathname);
    }
  }, [navigate]);

  // Auth views render with their own full-height layout (no shell chrome).
  if (
    route.view === "login" ||
    route.view === "signup" ||
    route.view === "forgot-password" ||
    route.view === "reset-password"
  ) {
    const mode =
      route.view === "login"
        ? "login"
        : route.view === "signup"
          ? "signup"
          : route.view === "forgot-password"
            ? "forgot"
            : "reset";
    return <AuthPage mode={mode} />;
  }

  return (
    <AppShell>
      {route.view === "home" && <HomePage />}
      {route.view === "browse" && <BrowsePage />}
      {route.view === "item" && route.itemId && (
        <ItemDetailsPage itemId={route.itemId} />
      )}
      {route.view === "report-lost" && <ReportForm type="lost" />}
      {route.view === "report-found" && <ReportForm type="found" />}
      {route.view === "about" && <AboutPage />}
      {route.view === "contact" && <ContactPage />}
      {route.view === "dashboard" && <UserDashboardPage />}
      {route.view === "admin" && <AdminDashboardPage />}
      {/* Fallback safety */}
      {route.view === "item" && !route.itemId && (
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <h1 className="font-display text-2xl font-bold">No item selected</h1>
          <button
            onClick={() => navigate("browse")}
            className="mt-4 text-primary hover:underline"
          >
            Back to browse
          </button>
        </div>
      )}
    </AppShell>
  );
}
