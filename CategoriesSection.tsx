"use client";

import { ArrowRight } from "lucide-react";
import { useCategories } from "@/lib/use-categories";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useSuloft } from "@/lib/store";
import { SectionHeading } from "../shared/SectionHeading";
import { getIcon } from "@/lib/icons";

export function CategoriesSection() {
  const navigate = useSuloft((s) => s.navigate);
  const categories = useCategories();

  return (
    <section className="bg-background py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Browse by category"
          title="What did you lose or find?"
          description="From electronics to clothing, ID cards to documents — explore every kind of item reported on campus."
        />

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((cat, i) => {
            const Icon = getIcon(cat.icon);
            return (
              <button
                key={cat.id}
                onClick={() => navigate("browse")}
                className="group relative flex flex-col items-start gap-3 overflow-hidden rounded-2xl border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md animate-fade-in-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <div>
                  <div className="font-display text-sm font-semibold text-foreground">
                    {cat.name}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                    {cat.description}
                  </div>
                </div>
                <ArrowRight className="absolute right-4 top-5 h-4 w-4 -translate-x-1 text-primary opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
              </button>
            );
          })}
        </div>

        {!isSupabaseConfigured && (
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Showing fallback categories. Connect Supabase to use live categories.
          </p>
        )}
      </div>
    </section>
  );
}
