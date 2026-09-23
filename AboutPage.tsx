"use client";

import {
  BookOpen,
  Building2,
  HandHeart,
  HelpCircle,
  Lock,
  Search,
  Send,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSuloft } from "@/lib/store";
import { SectionHeading } from "../shared/SectionHeading";

export function AboutPage() {
  const navigate = useSuloft((s) => s.navigate);

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-grid opacity-50" aria-hidden />
        <div className="absolute inset-0 bg-radial-fade" aria-hidden />
        <div className="relative mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8 lg:py-24">
          <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            About SULOFT
          </span>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            Built by the campus, for the campus.
          </h1>
          <p className="mt-5 text-pretty text-lg leading-relaxed text-muted-foreground">
            SULOFT is the official Lost &amp; Found portal of Superior University Okara, designed to make reporting, searching for, and safely returning belongings effortless for every student and staff member.
          </p>
        </div>
      </section>

      {/* What is SULOFT */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <SectionHeading
                align="left"
                eyebrow="What is SULOFT?"
                title="A single, trusted place for everything lost & found"
                description="SULOFT brings the entire Superior University Okara community together on one platform — students, staff, and administrators — so that belongings can find their way back to their owners quickly and safely."
              />
              <p className="mt-5 text-pretty leading-relaxed text-muted-foreground">
                Every semester, hundreds of items are misplaced on campus — phones left in the cafeteria, ID cards dropped at the bus stand, calculators forgotten in the examination hall. Until SULOFT, recovering these items meant physical notice boards, frantic WhatsApp messages, and lucky encounters. SULOFT digitises that process: a structured, searchable portal where every report is in one place, claims can be verified safely, and handovers happen on campus.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: Search, label: "Search & match", body: "Filter by category, location, date, and lost/found status." },
                { icon: ShieldCheck, label: "Verified claims", body: "Proof of ownership required before any handover." },
                { icon: Users, label: "Campus-wide", body: "Open to all students and staff with an SUO email." },
                { icon: BookOpen, label: "Audit trail", body: "Every report and claim is logged for transparency." },
              ].map((f, i) => (
                <div
                  key={f.label}
                  className="rounded-2xl border bg-card p-5 animate-fade-in-up"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <f.icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <h3 className="mt-4 font-display text-sm font-semibold">{f.label}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-muted/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="How SULOFT works"
            title="From report to return in four steps"
            description="A structured workflow keeps every listing safe, traceable, and easy to follow."
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Send, title: "Report", body: "Post a lost or found item with description, photo, and location in under two minutes." },
              { icon: Search, title: "Match", body: "The portal matches lost and found reports by category, location, and keywords." },
              { icon: HandHeart, title: "Claim", body: "Owners submit a claim with proof of ownership. The poster reviews it in their dashboard." },
              { icon: ShieldCheck, title: "Return", body: "After verification, both parties arrange a safe on-campus handover and close the listing." },
            ].map((s, i) => (
              <div
                key={s.title}
                className="relative rounded-2xl border bg-card p-6 animate-fade-in-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <span className="absolute right-5 top-5 font-display text-5xl font-bold text-primary/10">
                  0{i + 1}
                </span>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                  <s.icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why it was created */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <SectionHeading
                align="left"
                eyebrow="Why SULOFT was created"
                title="Solving a real problem on campus"
                description="Lost belongings affect students' daily lives — from ID cards needed at every exam, to calculators needed for mid-terms, to laptops holding months of coursework."
              />
              <p className="mt-5 text-pretty leading-relaxed text-muted-foreground">
                Before SULOFT, recovering a lost item meant scrolling through WhatsApp class groups, sticking hand-written posters on notice boards, and hoping the right person saw the right message at the right time. Found items piled up unclaimed at the library front desk and admin office because there was no central place to list them.
              </p>
              <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">
                SULOFT was built to fix this — a structured, searchable, and safe platform where every report lives in one place, where ownership can be verified before handover, and where the campus community works together to look after each other.
              </p>
            </div>
            <div className="space-y-4">
              {[
                { icon: Target, title: "Our mission", body: "Make every lost item on campus findable, and every found item returnable." },
                { icon: Lock, title: "Safety first", body: "Built-in verification steps, safe-handover guidance, and admin moderation." },
                { icon: Building2, title: "Built for SUO", body: "Tailored to the geography and culture of Superior University Okara." },
                { icon: Users, title: "Community-driven", body: "Students and staff across campus use SULOFT to look out for each other." },
              ].map((p) => (
                <div key={p.title} className="flex gap-4 rounded-2xl border bg-card p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <p.icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-semibold">{p.title}</h3>
                    <p className="mt-1 text-pretty text-sm text-muted-foreground">{p.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Safety guidelines */}
      <section className="bg-muted/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Safety guidelines"
            title="Read before you report or claim"
            description="SULOFT is built on trust. Follow these guidelines to keep yourself and the community safe."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {[
              { title: "Verify before handover", body: "Ask the claimant to describe unique features only the owner would know — a scratch, a sticker, the lock screen photo, or a receipt." },
              { title: "Meet in public, on-campus", body: "Pick a busy spot like the library, cafeteria, or admin block reception. Bring a friend if you can, and never meet off-campus alone." },
              { title: "Never share sensitive data", body: "Don't post IMEI numbers, full CNIC, bank PINs, or home addresses. Share these only privately after a claim is verified." },
              { title: "Report suspicious behaviour", body: "If anyone pressures you or behaves suspiciously, use the Report listing button and contact the admin office immediately." },
              { title: "Use official collection points", body: "The Central Library front desk and Admin Block reception are official lost & found collection points on campus." },
              { title: "Keep the platform clean", body: "Use the Report listing button for any post that violates guidelines — false reports, spam, or inappropriate content." },
            ].map((g, i) => (
              <div
                key={g.title}
                className="flex gap-4 rounded-2xl border bg-card p-5 animate-fade-in-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-display font-bold">
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-display text-sm font-semibold">{g.title}</h3>
                  <p className="mt-1 text-pretty text-sm text-muted-foreground">{g.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border bg-gradient-to-br from-primary to-emerald-600 px-6 py-12 text-center text-primary-foreground sm:px-12 lg:px-16">
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl text-balance">
              Ready to find what&apos;s lost — or return what&apos;s found?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-pretty text-primary-foreground/85">
              Join the students and staff using SULOFT to keep the campus a place where belongings — and people — are looked after.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                variant="secondary"
                onClick={() => navigate("signup")}
                className="bg-background text-primary hover:bg-background/90"
              >
                Create your account
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("browse")}
                className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
              >
                Browse items
              </Button>
            </div>
            <div className="mt-8 flex items-center justify-center gap-2 text-xs opacity-80">
              <HelpCircle className="h-3.5 w-3.5" />
              Questions? Visit the Contact &amp; Help page.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
