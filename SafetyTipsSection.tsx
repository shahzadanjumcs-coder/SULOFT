"use client";

import {
  Lock,
  Eye,
  ShieldAlert,
  Users,
  PhoneCall,
  Building2,
} from "lucide-react";
import { SectionHeading } from "../shared/SectionHeading";

const TIPS = [
  {
    icon: Lock,
    title: "Never share sensitive details publicly",
    body: "Don't post IMEI numbers, full CNIC, bank card PINs, or home addresses. Share these only privately once a claim is verified.",
  },
  {
    icon: Eye,
    title: "Always verify ownership before handover",
    body: "Ask the claimant to describe unique features only the owner would know — a scratch, a sticker, the lock screen photo, or a receipt.",
  },
  {
    icon: Users,
    title: "Meet in public, on-campus locations",
    body: "Pick a busy spot like the library, cafeteria, or admin block reception. Bring a friend if you can, and never meet off-campus alone.",
  },
  {
    icon: PhoneCall,
    title: "Report harassment immediately",
    body: "If anyone pressures you or behaves suspiciously, use the Report listing button and contact the admin office right away.",
  },
  {
    icon: ShieldAlert,
    title: "Don't hand over found items to strangers",
    body: "Hold the item until the owner is verified. If in doubt, hand the item to the admin office or library front desk for safekeeping.",
  },
  {
    icon: Building2,
    title: "Use official collection points",
    body: "The Central Library front desk and Admin Block reception are official lost & found collection points on campus.",
  },
];

export function SafetyTipsSection() {
  return (
    <section className="bg-muted/40 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Safety first"
          title="Stay safe while helping others"
          description="A few simple habits keep the SULOFT community safe for everyone. Please read these before arranging any handover."
        />

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {TIPS.map((tip, i) => (
            <div
              key={tip.title}
              className="group flex gap-4 rounded-2xl border bg-card p-5 transition-all hover:shadow-md animate-fade-in-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <tip.icon className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="font-display text-sm font-semibold text-foreground">
                  {tip.title}
                </h3>
                <p className="mt-1 text-pretty text-sm leading-relaxed text-muted-foreground">
                  {tip.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
