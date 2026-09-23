"use client";

import { useState } from "react";
import {
  ChevronDown,
  HelpCircle,
  LifeBuoy,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import { SectionHeading } from "../shared/SectionHeading";
import { useSuloft } from "@/lib/store";

const FAQS = [
  {
    q: "How do I report a lost item?",
    a: "Click 'Report Lost Item' in the navbar, fill in the form with as much detail as you can (name, category, description, location, date, photo), and submit. Your listing goes live immediately and appears in Browse Items.",
  },
  {
    q: "What if I find something that belongs to someone else?",
    a: "Click 'Report Found Item' in the navbar and post the item with a photo and where you found it. Do not hand the item to anyone until they have submitted a claim and you have verified their ownership.",
  },
  {
    q: "How do I claim an item I think is mine?",
    a: "Open the item details page and click 'Claim / Contact'. Write a message and describe unique features only the owner would know. The poster reviews your claim in their dashboard and responds.",
  },
  {
    q: "Is SULOFT only for Superior University Okara students and staff?",
    a: "Yes — SULOFT requires a valid @suokara.edu.pk email to sign up. This keeps the community safe and ensures everyone on the platform is part of the campus.",
  },
  {
    q: "Where should I meet to hand over an item?",
    a: "Always meet in a public, on-campus location — the Central Library front desk, Main Cafeteria, or Admin Block reception are official collection points. Never meet off-campus or alone.",
  },
  {
    q: "What if I see a suspicious listing?",
    a: "Use the 'Report listing' button on the item details page. An admin will review the report and take action. You can also contact the admin office directly using the details below.",
  },
  {
    q: "How long are listings kept on the portal?",
    a: "Active listings remain visible for 90 days. After that, items are automatically archived as 'expired' but remain in the original poster's dashboard. Returned items are kept in history indefinitely.",
  },
  {
    q: "Can I edit or delete my listing after posting?",
    a: "Yes — go to your dashboard, find the listing under 'Lost Reports' or 'Found Reports', and use the controls there. Once an item has an active claim, deleting requires admin approval.",
  },
];

export function ContactPage() {
  const navigate = useSuloft((s) => s.navigate);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setForm({ name: "", email: "", subject: "", message: "" });
      toast.success("Message sent", {
        description: "We'll get back to you within 1–2 working days.",
      });
    }, 700);
  };

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="border-b bg-muted/40">
        <div className="mx-auto max-w-3xl px-4 py-12 text-center sm:px-6 lg:px-8">
          <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            Contact & Help
          </span>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            We&apos;re here to help
          </h1>
          <p className="mt-3 text-pretty text-muted-foreground">
            Find quick answers in our FAQ, browse safety guidelines, or reach out to the SULOFT admin team directly.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-3">
            {/* Contact cards */}
            <div className="space-y-4">
              {[
                {
                  icon: Mail,
                  title: "Email us",
                  primary: "Contact information will be provided by the administration.",
                  secondary: "General enquiries & support",
                },
                {
                  icon: Phone,
                  title: "Call us",
                  primary: "Contact information will be provided by the administration.",
                  secondary: "Mon–Fri, 9:00 AM – 5:00 PM",
                },
                {
                  icon: MapPin,
                  title: "Visit us",
                  primary: "Admin Block, Reception",
                  secondary: "Superior University Okara Campus",
                },
              ].map((c) => (
                <div
                  key={c.title}
                  className="rounded-2xl border bg-card p-5 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <c.icon className="h-5 w-5" strokeWidth={1.75} />
                    </div>
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {c.title}
                      </div>
                      <div className="mt-0.5 font-display text-base font-semibold">
                        {c.primary}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {c.secondary}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Emergency banner */}
              <div className="rounded-2xl border-l-2 border-amber-400 bg-amber-50 p-5 dark:bg-amber-500/10">
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-200">
                  <ShieldAlert className="h-4 w-4" />
                  Safety emergency
                </div>
                <p className="mt-1.5 text-xs text-amber-700 dark:text-amber-300">
                  If you&apos;re being pressured, threatened, or feel unsafe during a handover, contact campus security immediately and report the listing to SULOFT admins.
                </p>
              </div>
            </div>

            {/* Contact form */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl border bg-card p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <MessageSquare className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-semibold">
                      Send us a message
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Fill out the form and we&apos;ll get back to you within 1–2 working days.
                    </p>
                  </div>
                </div>

                <form onSubmit={onSubmit} className="mt-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Name" required>
                      <Input
                        value={form.name}
                        onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                        placeholder="Your full name"
                      />
                    </Field>
                    <Field label="Email" required>
                      <Input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                        placeholder="you@suokara.edu.pk"
                      />
                    </Field>
                  </div>
                  <Field label="Subject">
                    <Input
                      value={form.subject}
                      onChange={(e) => setForm((s) => ({ ...s, subject: e.target.value }))}
                      placeholder="What's this about?"
                    />
                  </Field>
                  <Field label="Message" required>
                    <Textarea
                      rows={5}
                      value={form.message}
                      onChange={(e) => setForm((s) => ({ ...s, message: e.target.value }))}
                      placeholder="Tell us how we can help…"
                    />
                  </Field>
                  <div className="flex justify-end">
                    <Button type="submit" size="lg" disabled={submitting}>
                      <Send className="h-4 w-4" />
                      {submitting ? "Sending…" : "Send message"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Help center / FAQ */}
      <section className="bg-muted/40 py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Help center"
            title="Frequently asked questions"
            description="Quick answers to the most common SULOFT questions. Can't find what you're looking for? Use the contact form above."
          />

          <div className="mt-10">
            <Accordion type="single" collapsible className="space-y-3">
              {FAQS.map((f, i) => (
                <AccordionItem
                  key={f.q}
                  value={`faq-${i}`}
                  className="rounded-2xl border bg-card px-5"
                >
                  <AccordionTrigger className="text-left hover:no-underline">
                    <span className="flex items-center gap-3 font-display text-base font-medium">
                      <HelpCircle className="h-4 w-4 shrink-0 text-primary" />
                      {f.q}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-pretty leading-relaxed text-muted-foreground">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Quick links */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: LifeBuoy,
                title: "Report a lost item",
                body: "Lost something on campus? Post it now — the more detail, the faster we can help you find it.",
                cta: "Report lost",
                action: () => navigate("report-lost"),
              },
              {
                icon: Send,
                title: "Report a found item",
                body: "Found something? Post it so the owner can recognise it and submit a claim.",
                cta: "Report found",
                action: () => navigate("report-found"),
              },
              {
                icon: ShieldAlert,
                title: "Report a problem listing",
                body: "Spotted something suspicious, inappropriate, or unsafe? Let the admin team know.",
                cta: "Browse items",
                action: () => navigate("browse"),
              },
            ].map((q) => (
              <div
                key={q.title}
                className="flex flex-col rounded-2xl border bg-card p-6"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <q.icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <h3 className="mt-4 font-display text-base font-semibold">
                  {q.title}
                </h3>
                <p className="mt-1.5 flex-1 text-pretty text-sm text-muted-foreground">
                  {q.body}
                </p>
                <Button onClick={q.action} variant="outline" className="mt-4 justify-start">
                  {q.cta}
                  <ChevronDown className="ml-auto -rotate-90 h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
