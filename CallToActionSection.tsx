"use client";

import { ArrowRight, Sparkles, PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSuloft } from "@/lib/store";

export function CallToActionSection() {
  const navigate = useSuloft((s) => s.navigate);

  return (
    <section className="bg-background py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary to-emerald-600 px-6 py-14 text-primary-foreground sm:px-12 lg:px-16">
          <div className="absolute inset-0 bg-grid opacity-10" aria-hidden />
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" aria-hidden />
          <div className="absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" aria-hidden />

          <div className="relative grid items-center gap-8 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl text-balance">
                Be the reason something finds its way home.
              </h2>
              <p className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-primary-foreground/85">
                Every report you file and every item you return strengthens the campus community. Join the students and staff using SULOFT to keep belongings — and people — looked after.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => navigate("report-lost")}
                  className="bg-background text-primary hover:bg-background/90"
                >
                  <Sparkles className="h-4 w-4" />
                  Report a Lost Item
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("report-found")}
                  className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <PackageSearch className="h-4 w-4" />
                  Report a Found Item
                </Button>
              </div>
            </div>

            <div className="relative hidden lg:block">
              {/* Decorative card stack */}
              <div className="relative mx-auto max-w-sm">
                <div className="absolute -left-6 top-6 h-full w-full rotate-[-6deg] rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10" />
                <div className="absolute -right-6 -top-6 h-full w-full rotate-[6deg] rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10" />
                <div className="relative rounded-2xl bg-primary-foreground/15 p-6 backdrop-blur">
                  <div className="font-display text-sm font-medium uppercase tracking-wider opacity-80">
                    Quick start
                  </div>
                  <ul className="mt-4 space-y-3 text-sm">
                    {[
                      "Create your free account with your SUO email",
                      "Post a lost or found item in under 2 minutes",
                      "Receive instant alerts when someone claims your item",
                      "Coordinate a safe, on-campus handover",
                    ].map((s, i) => (
                      <li key={s} className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-foreground/20 text-xs font-semibold">
                          {i + 1}
                        </span>
                        <span className="opacity-90">{s}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => navigate("signup")}
                    className="mt-5 w-full bg-background text-primary hover:bg-background/90"
                  >
                    Get started — it&apos;s free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
