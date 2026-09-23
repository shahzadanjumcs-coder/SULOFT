"use client";

import { Search, Send, HandHeart, CheckCircle2 } from "lucide-react";
import { SectionHeading } from "../shared/SectionHeading";

const STEPS = [
  {
    icon: Search,
    title: "Search & Report",
    description:
      "Lost something? File a report with description, photo, and last known location. Found something? Post it so the owner can find you.",
  },
  {
    icon: Send,
    title: "Match & Claim",
    description:
      "When something matches, the original owner submits a claim with proof of ownership. The poster is notified instantly in their dashboard.",
  },
  {
    icon: HandHeart,
    title: "Verify & Meet",
    description:
      "Both parties verify the details through secure in-app messaging. Arrange a safe, public, on-campus handover spot — never meet alone.",
  },
  {
    icon: CheckCircle2,
    title: "Return & Close",
    description:
      "Once the item is safely back with its owner, mark the listing as returned. The system updates statistics automatically.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="relative overflow-hidden bg-muted/40 py-20">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="How SULOFT works"
          title="A simple, four-step recovery process"
          description="SULOFT brings the campus community together so belongings find their way home faster — and safely."
        />

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className="group relative rounded-2xl border bg-card p-6 transition-shadow hover:shadow-md animate-fade-in-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {/* Step number */}
              <div className="absolute right-5 top-5 font-display text-5xl font-bold text-primary/10">
                0{i + 1}
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
                <step.icon className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <h3 className="mt-5 font-display text-lg font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>

              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div className="absolute -right-3 top-1/2 hidden h-px w-6 bg-primary/20 lg:block" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
