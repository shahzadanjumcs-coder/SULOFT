"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useSuloft } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { departments } from "@/lib/mock-data";
import { usePortalStats } from "@/lib/use-portal-stats";

type Mode = "login" | "signup" | "forgot" | "reset";

export function AuthPage({ mode }: { mode: Mode }) {
  const navigate = useSuloft((s) => s.navigate);
  const {
    signInWithPassword,
    signUp,
    signOut: _signOut,
    resetPasswordForEmail,
    updatePassword,
  } = useAuth();
  const {
    activeItems,
    returnedItems,
    recoveryRate,
    loading: statsLoading,
  } = usePortalStats();

  const [submitting, setSubmitting] = useState(false);
  const [confirmationRequired, setConfirmationRequired] = useState(false);

  const config = {
    login: {
      title: "Welcome back",
      subtitle: "Sign in to your SULOFT account to manage your reports and claims.",
      submitLabel: "Sign in",
      alt: "Don't have an account? Sign up",
      altMode: "signup" as const,
    },
    signup: {
      title: "Create your account",
      subtitle: "Join SULOFT — the official Lost & Found portal for Superior University Okara.",
      submitLabel: "Create account",
      alt: "Already have an account? Sign in",
      altMode: "login" as const,
    },
    forgot: {
      title: "Reset your password",
      subtitle: "Enter your SUO email and we'll send you a reset link.",
      submitLabel: "Send reset link",
      alt: "Back to sign in",
      altMode: "login" as const,
    },
    reset: {
      title: "Set a new password",
      subtitle: "Choose a strong password you don't use anywhere else.",
      submitLabel: "Update password",
      alt: "Back to sign in",
      altMode: "login" as const,
    },
  }[mode];

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    student_id: "",
    department: "",
    password: "",
    confirm_password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: keyof typeof form, v: string) => {
    setForm((s) => ({ ...s, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (mode === "signup") {
      if (form.full_name.trim().length < 3)
        next.full_name = "Please enter your full name.";
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email))
        next.email = "Enter a valid email address.";
      if (!form.student_id.trim()) next.student_id = "Student ID is required.";
      if (!form.department.trim()) next.department = "Please select your department.";
      if (form.password.length < 8)
        next.password = "Password must be at least 8 characters.";
      if (form.confirm_password !== form.password)
        next.confirm_password = "Passwords don't match.";
    } else if (mode === "login") {
      if (!form.email) next.email = "Email is required.";
      if (!form.password) next.password = "Password is required.";
    } else if (mode === "forgot") {
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email))
        next.email = "Enter a valid email address.";
    } else if (mode === "reset") {
      if (form.password.length < 8)
        next.password = "Password must be at least 8 characters.";
      if (form.confirm_password !== form.password)
        next.confirm_password = "Passwords don't match.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      toast.error("Supabase is not configured", {
        description: "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local — see SETUP.md.",
      });
      return;
    }
    if (!validate()) {
      toast.error("Please fix the highlighted fields.");
      return;
    }
    setSubmitting(true);

    try {
      if (mode === "login") {
        const { error } = await signInWithPassword(
          form.email.trim(),
          form.password
        );
        if (error) {
          toast.error("Sign in failed", { description: error });
        } else {
          toast.success("Signed in successfully", {
            description: "Welcome back to SULOFT!",
          });
          navigate("dashboard");
        }
      } else if (mode === "signup") {
        const { error, needsEmailConfirmation } = await signUp(
          form.email.trim(),
          form.password,
          {
            full_name: form.full_name.trim(),
            student_id: form.student_id.trim(),
            department: form.department.trim(),
          }
        );
        if (error) {
          toast.error("Sign up failed", { description: error });
        } else if (needsEmailConfirmation) {
          setConfirmationRequired(true);
          toast.success("Check your inbox", {
            description:
              "We sent you a confirmation link. Click it to activate your account, then sign in.",
          });
        } else {
          toast.success("Account created", {
            description: "Welcome to SULOFT! Your account is ready.",
          });
          navigate("dashboard");
        }
      } else if (mode === "forgot") {
        const { error } = await resetPasswordForEmail(form.email.trim());
        if (error) {
          toast.error("Could not send reset link", { description: error });
        } else {
          toast.success("Reset link sent", {
            description: "Check your inbox for an email from SULOFT.",
          });
          navigate("login");
        }
      } else if (mode === "reset") {
        const { error } = await updatePassword(form.password);
        if (error) {
          toast.error("Could not update password", { description: error });
        } else {
          toast.success("Password updated", {
            description: "You can now sign in with your new password.",
          });
          navigate("login");
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="relative grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
        {/* Visual side */}
        <div className="relative hidden overflow-hidden bg-primary lg:flex">
          <div className="absolute inset-0 bg-grid opacity-10" aria-hidden />
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary-foreground/10 blur-3xl" aria-hidden />
          <div className="absolute -left-32 -bottom-32 h-96 w-96 rounded-full bg-primary-foreground/10 blur-3xl" aria-hidden />

          <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
            <button
              onClick={() => navigate("home")}
              className="flex items-center gap-3 text-left"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/15 backdrop-blur">
                <ShieldCheck className="h-5 w-5" strokeWidth={2.25} />
              </div>
              <div>
                <div className="font-display text-lg font-bold tracking-tight">
                  SULOFT
                </div>
                <div className="text-[10px] font-medium uppercase tracking-wider opacity-80">
                  Superior University Okara
                </div>
              </div>
            </button>

            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight text-balance">
                Lost something? Find it. Found something? Help return it.
              </h2>
              <p className="mt-4 max-w-md text-pretty text-primary-foreground/80">
                The official Lost &amp; Found portal for Superior University Okara Campus students and staff. Every report you file helps the community.
              </p>

              <div className="mt-8 grid grid-cols-3 gap-3">
                {[
                  [String(activeItems + returnedItems), "Items reported"],
                  [String(returnedItems), "Items returned"],
                  [`${recoveryRate}%`, "Recovery rate"],
                ].map(([v, l]) => (
                  <div key={l} className="rounded-xl bg-primary-foreground/10 p-4 backdrop-blur">
                    <div className="font-display text-2xl font-bold">{statsLoading ? "…" : v}</div>
                    <div className="mt-1 text-xs opacity-80">{l}</div>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs opacity-60">
              © {new Date().getFullYear()} SULOFT · Superior University Okara
            </p>
          </div>
        </div>

        {/* Form side */}
        <div className="flex items-center justify-center px-4 py-12 sm:px-6 lg:px-12">
          <div className="w-full max-w-md">
            <button
              onClick={() => navigate("home")}
              className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </button>

            {/* Mobile brand */}
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <ShieldCheck className="h-5 w-5" strokeWidth={2.25} />
              </div>
              <div>
                <div className="font-display text-lg font-bold tracking-tight">
                  SULOFT
                </div>
                <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Superior University Okara
                </div>
              </div>
            </div>

            {/* Supabase-not-configured banner */}
            {!isSupabaseConfigured && (
              <div className="mb-5 rounded-xl border-l-2 border-amber-400 bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertCircle className="h-4 w-4" />
                  Supabase not configured
                </div>
                <p className="mt-1">
                  Add <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
                  <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{" "}
                  <code className="font-mono">.env.local</code>. See SETUP.md for details.
                </p>
              </div>
            )}

            {confirmationRequired ? (
              <div className="rounded-2xl border bg-card p-6 text-center">
                <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
                <h2 className="mt-4 font-display text-xl font-bold">
                  Check your inbox
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  We&apos;ve sent a confirmation link to{" "}
                  <span className="font-medium text-foreground">
                    {form.email}
                  </span>
                  . Click the link to activate your account, then sign in below.
                </p>
                <Button
                  onClick={() => navigate("login")}
                  className="mt-5 w-full"
                >
                  Go to sign in
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                  {config.title}
                </h1>
                <p className="mt-1.5 text-pretty text-sm text-muted-foreground">
                  {config.subtitle}
                </p>

                <form onSubmit={onSubmit} className="mt-6 space-y-4">
                  {mode === "signup" && (
                    <Field label="Full name" error={errors.full_name} required>
                      <Input
                        value={form.full_name}
                        onChange={(e) => set("full_name", e.target.value)}
                        placeholder="e.g. Shahzad Anjum"
                        aria-invalid={!!errors.full_name}
                      />
                    </Field>
                  )}

                  <Field label="University email" error={errors.email} required>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      placeholder="yourname@suokara.edu.pk"
                      aria-invalid={!!errors.email}
                    />
                  </Field>

                  {mode === "signup" && (
                    <>
                      <Field label="Student ID" error={errors.student_id} required>
                        <Input
                          value={form.student_id}
                          onChange={(e) => set("student_id", e.target.value)}
                          placeholder="e.g. BSCS-22-117"
                          aria-invalid={!!errors.student_id}
                        />
                      </Field>
                      <Field label="Department" error={errors.department} required>
                        <select
                          value={form.department}
                          onChange={(e) => set("department", e.target.value)}
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-ring/50"
                        >
                          <option value="" disabled>
                            Select your department
                          </option>
                          {departments.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </>
                  )}

                  {(mode === "login" || mode === "signup" || mode === "reset") && (
                    <>
                      <Field
                        label={mode === "reset" ? "New password" : "Password"}
                        error={errors.password}
                        required
                        hint={mode === "signup" ? "At least 8 characters." : undefined}
                      >
                        <Input
                          type="password"
                          value={form.password}
                          onChange={(e) => set("password", e.target.value)}
                          placeholder="••••••••"
                          aria-invalid={!!errors.password}
                        />
                      </Field>

                      {(mode === "signup" || mode === "reset") && (
                        <Field
                          label="Confirm password"
                          error={errors.confirm_password}
                          required
                        >
                          <Input
                            type="password"
                            value={form.confirm_password}
                            onChange={(e) => set("confirm_password", e.target.value)}
                            placeholder="••••••••"
                            aria-invalid={!!errors.confirm_password}
                          />
                        </Field>
                      )}
                    </>
                  )}

                  {mode === "login" && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => navigate("forgot-password")}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={submitting || !isSupabaseConfigured}
                  >
                    {submitting ? "Please wait…" : config.submitLabel}
                    <ArrowRight className="h-4 w-4" />
                  </Button>

                  {mode === "login" && (
                    <div className="rounded-lg border bg-muted/30 px-3 py-2 text-center text-xs text-muted-foreground">
                      <Mail className="mr-1 inline h-3 w-3" />
                      Sign in with your SUO email and password. New here? Use the Sign up tab.
                    </div>
                  )}
                </form>

                <p className="mt-6 text-center text-sm text-muted-foreground">
                  <button
                    onClick={() => navigate(config.altMode)}
                    className="font-medium text-primary hover:underline"
                  >
                    {config.alt}
                  </button>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
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
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
