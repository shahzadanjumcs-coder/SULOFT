"use client";

import { useState } from "react";
import { Sparkles, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { useSuloft } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { useCategories } from "@/lib/use-categories";
import { campusLocations } from "@/lib/mock-data";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createItem, uploadItemImage } from "@/lib/api";
import type { ContactPreference, ItemType } from "@/lib/types";
import { ImageUpload } from "../shared/ImageUpload";

interface ReportFormProps {
  type: ItemType;
}

interface FormState {
  title: string;
  category_id: string;
  description: string;
  location: string;
  date: string;
  time: string;
  additional_info: string;
  contact_preference: ContactPreference;
  imagePreview: string; // local preview URL
  imageFile: File | null;
}

const initial: FormState = {
  title: "",
  category_id: "",
  description: "",
  location: "",
  date: "",
  time: "",
  additional_info: "",
  contact_preference: "email",
  imagePreview: "",
  imageFile: null,
};

export function ReportForm({ type }: ReportFormProps) {
  const navigate = useSuloft((s) => s.navigate);
  const bumpDataVersion = useSuloft((s) => s.bumpDataVersion);
  const { user } = useAuth();
  const categories = useCategories();
  const [form, setForm] = useState<FormState>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const isLost = type === "lost";
  const heading = isLost ? "Report a Lost Item" : "Report a Found Item";
  const subtitle = isLost
    ? "Tell us what you lost — the more detail you provide, the faster someone can help you find it."
    : "Tell us what you found — the more detail you provide, the easier it is for the owner to recognise it.";

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((s) => ({ ...s, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!form.title.trim()) next.title = "Please give the item a name.";
    if (!form.category_id) next.category_id = "Please choose a category.";
    if (form.description.trim().length < 20)
      next.description = "Description must be at least 20 characters.";
    if (!form.location.trim()) next.location = "Please tell us where on campus.";
    if (!form.date)
      next.date = `Please choose the date the item was ${isLost ? "lost" : "found"}.`;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSupabaseConfigured) {
      toast.error("Supabase is not configured", {
        description: "Add your credentials to .env.local — see SETUP.md.",
      });
      return;
    }
    if (!user) {
      toast.error("Sign in to report an item", {
        description: "You need an account to post a lost or found report.",
      });
      navigate("login");
      return;
    }
    if (!validate()) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Upload image to Supabase Storage (if provided)
      let imageUrl: string | null = null;
      let imagePath: string | null = null;
      if (form.imageFile) {
        toast.loading("Uploading image…", { id: "upload" });
        const up = await uploadItemImage(user.id, form.imageFile);
        if (up.error || !up.url || !up.path) {
          toast.dismiss("upload");
          toast.error("Image upload failed", { description: up.error ?? "Unknown error" });
          setSubmitting(false);
          return;
        }
        imageUrl = up.url;
        imagePath = up.path;
        toast.dismiss("upload");
      }

      // 2. Insert the item row
      const { data, error } = await createItem({
        title: form.title.trim(),
        description: form.description.trim(),
        type,
        category_id: form.category_id,
        location: form.location.trim(),
        date: form.date,
        time: form.time || null,
        image_url: imageUrl,
        image_path: imagePath,
        contact_preference: form.contact_preference,
        additional_info: form.additional_info.trim() || null,
      });

      if (error || !data) {
        toast.error("Could not save your report", {
          description: error ?? "Unknown error",
        });
        setSubmitting(false);
        return;
      }

      // 3. Success — reset form and navigate
      setForm(initial);
      bumpDataVersion();
      toast.success(
        isLost ? "Lost item reported successfully!" : "Found item reported successfully!",
        {
          description: "Your listing is now live. We'll notify you of any new claims.",
        }
      );
      navigate("browse");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <section className="border-b bg-muted/40">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Sparkles className="h-5 w-5" strokeWidth={2} />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                {isLost ? "Lost an item" : "Found an item"}
              </span>
              <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                {heading}
              </h1>
            </div>
          </div>
          <p className="mt-3 max-w-2xl text-pretty text-muted-foreground">
            {subtitle}
          </p>

          {!user && isSupabaseConfigured && (
            <div className="mt-4 rounded-xl border-l-2 border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
              You need to{" "}
              <button
                onClick={() => navigate("login")}
                className="font-semibold underline"
              >
                sign in
              </button>{" "}
              to submit a report.
            </div>
          )}
        </div>
      </section>

      <section className="py-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
            {/* Main form */}
            <div className="space-y-5 lg:col-span-2">
              {/* Basic info */}
              <FormSection
                title="Basic information"
                description="Help the item be recognised at a glance."
              >
                <Field label="Item name" error={errors.title} required>
                  <Input
                    value={form.title}
                    onChange={(e) => set("title", e.target.value)}
                    placeholder={isLost ? "e.g. Black Samsung Galaxy A52" : "e.g. Brown leather wallet"}
                    aria-invalid={!!errors.title}
                  />
                </Field>

                <Field label="Category" error={errors.category_id} required>
                  <Select
                    value={form.category_id}
                    onValueChange={(v) => set("category_id", v)}
                  >
                    <SelectTrigger aria-invalid={!!errors.category_id}>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field
                  label="Description"
                  error={errors.description}
                  required
                  hint="Mention colour, brand, distinctive marks, contents, etc."
                >
                  <Textarea
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    rows={4}
                    placeholder="Describe the item in as much detail as you can — colour, brand, distinguishing features, what was inside…"
                    aria-invalid={!!errors.description}
                  />
                </Field>
              </FormSection>

              {/* When & where */}
              <FormSection
                title="When & where"
                description={isLost ? "Where do you think you lost it?" : "Where exactly did you find it?"}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label={isLost ? "Date lost" : "Date found"}
                    error={errors.date}
                    required
                  >
                    <Input
                      type="date"
                      value={form.date}
                      onChange={(e) => set("date", e.target.value)}
                      max={new Date().toISOString().split("T")[0]}
                      aria-invalid={!!errors.date}
                    />
                  </Field>
                  <Field label="Time (optional)">
                    <Input
                      type="time"
                      value={form.time}
                      onChange={(e) => set("time", e.target.value)}
                    />
                  </Field>
                </div>

                <Field label="Location" error={errors.location} required>
                  <Select
                    value={form.location}
                    onValueChange={(v) => set("location", v)}
                  >
                    <SelectTrigger aria-invalid={!!errors.location}>
                      <SelectValue placeholder="Pick a campus location" />
                    </SelectTrigger>
                    <SelectContent>
                      {campusLocations.map((l) => (
                        <SelectItem key={l} value={l}>
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <p className="-mt-1 text-xs text-muted-foreground">
                  Tip: be specific — e.g. &ldquo;Library — 2nd Floor Reading Area&rdquo;.
                </p>
              </FormSection>

              {/* Image */}
              <FormSection
                title="Photo"
                description={isLost ? "Upload a clear photo of the item if you have one." : "Upload a photo of the found item."}
              >
                <ImageUpload
                  value={form.imagePreview}
                  onChange={(url) => {
                    // The ImageUpload helper passes us a preview URL — but for
                    // real upload, we need the File. We accept both: when a
                    // new file is dropped, the URL is a blob: URL we can fetch
                    // back into a File. For simplicity, we re-read from the
                    // hidden file input via a callback.
                    set("imagePreview", url);
                    if (url.startsWith("blob:")) {
                      // fetch the blob and store as File for later upload
                      fetch(url)
                        .then((r) => r.blob())
                        .then(
                          (b) =>
                            set(
                              "imageFile",
                              new File([b], "upload.jpg", { type: b.type || "image/jpeg" })
                            )
                        );
                    } else if (url === "") {
                      set("imageFile", null);
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Images are automatically resized and re-compressed before upload.
                  EXIF metadata is stripped for your privacy.
                </p>
              </FormSection>

              {/* Additional */}
              <FormSection
                title="Additional information"
                description="Anything else that would help verify ownership."
              >
                <Textarea
                  value={form.additional_info}
                  onChange={(e) => set("additional_info", e.target.value)}
                  rows={3}
                  placeholder="E.g. IMEI available on request, receipt available, item has special markings…"
                />
              </FormSection>
            </div>

            {/* Sidebar */}
            <aside className="space-y-5">
              <FormSection
                title="Contact preference"
                description="How would you like to be reached?"
              >
                <RadioGroup
                  value={form.contact_preference}
                  onValueChange={(v) => set("contact_preference", v as ContactPreference)}
                  className="space-y-2"
                >
                  {[
                    { value: "email", label: "Email", hint: "Send me an email when someone claims my item." },
                    { value: "phone", label: "Phone call", hint: "Available to existing students only." },
                    { value: "in_app", label: "In-app notifications", hint: "See updates in your dashboard." },
                    { value: "dashboard_only", label: "Dashboard only", hint: "Don't notify me by email or phone." },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      htmlFor={`pref-${opt.value}`}
                      className="flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors hover:bg-secondary has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                    >
                      <RadioGroupItem id={`pref-${opt.value}`} value={opt.value} className="mt-0.5" />
                      <div>
                        <div className="text-sm font-medium">{opt.label}</div>
                        <div className="text-xs text-muted-foreground">{opt.hint}</div>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              </FormSection>

              {/* Tips */}
              <div className="rounded-2xl border-l-2 border-primary bg-primary/5 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <Info className="h-4 w-4" />
                  Quick tips
                </div>
                <ul className="mt-2 space-y-2 text-xs text-muted-foreground">
                  <li className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    Be specific — unique details help verify ownership.
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    Don&apos;t post sensitive data (IMEI, full CNIC, PINs).
                  </li>
                  <li className="flex gap-2">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    Always meet in a public, on-campus place to hand over.
                  </li>
                </ul>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={submitting || !isSupabaseConfigured || !user}
              >
                {submitting ? "Submitting…" : isLost ? "Submit lost report" : "Submit found report"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                By submitting, you agree to SULOFT&apos;s safety guidelines.
              </p>
            </aside>
          </form>
        </div>
      </section>
    </div>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="mb-4">
        <h3 className="font-display text-base font-semibold text-foreground">
          {title}
        </h3>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
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
      {error && (
        <p className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}
