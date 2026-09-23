"use client";

import { Heart, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { useSuloft } from "@/lib/store";
import type { ViewKey } from "@/lib/types";

const FOOTER_LINKS: { heading: string; links: { label: string; view: ViewKey }[] }[] = [
  {
    heading: "Portal",
    links: [
      { label: "Browse Items", view: "browse" },
      { label: "Report Lost Item", view: "report-lost" },
      { label: "Report Found Item", view: "report-found" },
    ],
  },
  {
    heading: "Account",
    links: [
      { label: "Login", view: "login" },
      { label: "Sign Up", view: "signup" },
      { label: "Forgot Password", view: "forgot-password" },
    ],
  },
  {
    heading: "Information",
    links: [
      { label: "About SULOFT", view: "about" },
      { label: "Contact & Help", view: "contact" },
      { label: "Safety Guidelines", view: "about" },
    ],
  },
];

export function Footer() {
  const navigate = useSuloft((s) => s.navigate);

  return (
    <footer className="mt-auto border-t bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-5">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <ShieldCheck className="h-5 w-5" strokeWidth={2.25} />
              </div>
              <div className="leading-tight">
                <div className="font-display text-lg font-bold tracking-tight">
                  SULOFT
                </div>
                <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Superior University Okara
                </div>
              </div>
            </div>
            <p className="mt-4 max-w-sm text-pretty text-sm leading-relaxed text-muted-foreground">
              The official Lost & Found portal for Superior University Okara. Lost something? Find it. Found something? Help return it.
            </p>

            {/* University logo placeholder */}
            <div className="mt-5 inline-flex items-center gap-3 rounded-xl border border-dashed bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-background">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <span>Official university logo area</span>
            </div>
          </div>

          {/* Link columns */}
          {FOOTER_LINKS.map((group) => (
            <div key={group.heading}>
              <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-foreground">
                {group.heading}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => navigate(link.view)}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact strip */}
        <div className="mt-10 grid gap-4 border-t pt-6 text-sm text-muted-foreground sm:grid-cols-3">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            <span>Contact via the Help page</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-primary" />
            <span>Admin Block, Reception</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span>Superior University Okara Campus</span>
          </div>
        </div>

        {/* Credit */}
        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} SULOFT · Superior University Okara. All rights reserved.
          </p>
          <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            Developed by
            <span className="font-semibold text-foreground">
              Shahzad Anjum
            </span>
            <span aria-hidden>—</span>
            <span>BS Computer Science</span>
            <Heart className="h-3.5 w-3.5 text-primary" fill="currentColor" />
          </p>
        </div>
      </div>
    </footer>
  );
}
