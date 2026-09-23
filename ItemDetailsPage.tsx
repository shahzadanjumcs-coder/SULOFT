"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Flag,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Tag,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useSuloft } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { useCategories } from "@/lib/use-categories";
import { fetchItemById, createClaim, createReport } from "@/lib/api";
import { ItemImage } from "../shared/ItemImage";
import { TypeBadge, StatusBadge } from "../shared/StatusBadge";
import { formatDate, formatRelative, initials } from "@/lib/format";
import type { Item } from "@/lib/types";

export function ItemDetailsPage({ itemId }: { itemId: string }) {
  const navigate = useSuloft((s) => s.navigate);
  const { user } = useAuth();
  const categories = useCategories();

  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [claimOpen, setClaimOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [claimForm, setClaimForm] = useState({ message: "", proof: "" });
  const [reportReason, setReportReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    if (!itemId) return;
    (async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await fetchItemById(itemId);
      if (!active) return;
      if (error) {
        setError(error);
        setItem(null);
      } else {
        setItem(data);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [itemId]);

  const category = useMemo(
    () =>
      item?.category ||
      categories.find((c) => c.id === item?.category_id),
    [item, categories]
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <div className="aspect-[4/3] animate-pulse rounded-3xl bg-muted" />
          </div>
          <div className="space-y-4 lg:col-span-2">
            <div className="h-6 w-32 animate-pulse rounded-full bg-muted" />
            <div className="h-8 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-32 animate-pulse rounded-2xl bg-muted" />
            <div className="h-10 w-full animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <h1 className="font-display text-2xl font-bold">
          {error ? "Could not load item" : "Item not found"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {error || "The item you're looking for may have been removed or its link is invalid."}
        </p>
        <Button onClick={() => navigate("browse")} className="mt-6">
          <ArrowLeft className="h-4 w-4" />
          Back to browse
        </Button>
      </div>
    );
  }

  const isMine = user?.id === item.user_id;
  const poster = item.poster;

  const onSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Sign in to submit a claim", {
        description: "You need an account to claim an item.",
      });
      setClaimOpen(false);
      navigate("login");
      return;
    }
    if (!claimForm.message.trim() || !claimForm.proof.trim()) {
      toast.error("Please fill in both the message and proof of ownership.");
      return;
    }
    setSubmitting(true);
    const { error } = await createClaim({
      item_id: item.id,
      message: claimForm.message.trim(),
      proof: claimForm.proof.trim(),
    });
    setSubmitting(false);
    if (error) {
      toast.error("Could not submit claim", { description: error });
      return;
    }
    setClaimOpen(false);
    setClaimForm({ message: "", proof: "" });
    toast.success("Your claim has been submitted!", {
      description: "The poster will be notified and can review it in their dashboard.",
    });
  };

  const onSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Sign in to report a listing", {
        description: "You need an account to flag a listing.",
      });
      setReportOpen(false);
      navigate("login");
      return;
    }
    if (!reportReason.trim()) {
      toast.error("Please describe the reason for your report.");
      return;
    }
    setSubmitting(true);
    const { error } = await createReport(item.id, reportReason.trim());
    setSubmitting(false);
    if (error) {
      toast.error("Could not submit report", { description: error });
      return;
    }
    setReportOpen(false);
    setReportReason("");
    toast.success("Report submitted", {
      description: "Thank you — an admin will review this listing shortly.",
    });
  };

  return (
    <div className="animate-fade-in">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <button
          onClick={() => navigate("browse")}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to browse
        </button>

        <div className="mt-6 grid gap-8 lg:grid-cols-5">
          {/* Image */}
          <div className="lg:col-span-3">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border bg-muted shadow-sm">
              <ItemImage
                title={item.title}
                categoryId={item.category_id}
                type={item.type}
                imageUrl={item.image_url || undefined}
                rounded="none"
                className="h-full w-full"
              />
            </div>

            {/* Image meta strip */}
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>Posted {formatRelative(item.created_at)}</span>
              {item.image_url ? (
                <span>Photo provided by poster</span>
              ) : (
                <span>Illustrative placeholder · no photo uploaded</span>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="lg:col-span-2">
            <div className="flex flex-wrap items-center gap-2">
              <TypeBadge type={item.type} />
              <StatusBadge status={item.status} />
              {category && (
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                  <Tag className="h-3 w-3" />
                  {category.name}
                </span>
              )}
            </div>

            <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {item.title}
            </h1>

            {/* Key info grid */}
            <dl className="mt-5 grid gap-3 rounded-2xl border bg-card p-5 sm:grid-cols-2">
              <InfoRow icon={MapPin} label="Location" value={item.location} />
              <InfoRow
                icon={Calendar}
                label={item.type === "lost" ? "Date lost" : "Date found"}
                value={formatDate(item.date)}
              />
              {item.time && (
                <InfoRow icon={Clock} label="Time" value={item.time} />
              )}
              <InfoRow
                icon={User}
                label="Posted by"
                value={poster ? poster.full_name : "Unknown"}
              />
            </dl>

            {/* Description */}
            <div className="mt-5">
              <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Description
              </h3>
              <p className="mt-2 text-pretty leading-relaxed text-foreground">
                {item.description}
              </p>
              {item.additional_info && (
                <div className="mt-3 rounded-xl border-l-2 border-primary/40 bg-primary/5 px-4 py-3 text-sm">
                  <div className="text-xs font-semibold uppercase tracking-wider text-primary">
                    Additional info
                  </div>
                  <p className="mt-1 text-pretty text-foreground">
                    {item.additional_info}
                  </p>
                </div>
              )}
            </div>

            {/* Poster card */}
            {poster && (
              <div className="mt-5 flex items-center gap-3 rounded-2xl border bg-card p-4">
                <Avatar className="h-11 w-11 border">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {initials(poster.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{poster.full_name}</span>
                    {poster.role === "staff" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                        <ShieldCheck className="h-3 w-3" />
                        {poster.role}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {poster.department} · {poster.student_id}
                  </div>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  Member since
                  <div className="font-medium text-foreground">
                    {formatDate(poster.created_at)}
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              {isMine ? (
                <Button disabled className="flex-1" size="lg">
                  This is your listing
                </Button>
              ) : (
                <Dialog open={claimOpen} onOpenChange={setClaimOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex-1" size="lg">
                      <MessageCircle className="h-4 w-4" />
                      Claim / Contact
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Submit a claim for this item</DialogTitle>
                      <DialogDescription>
                        Provide a message and proof of ownership so the poster can verify you&apos;re the rightful owner.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={onSubmitClaim} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="claim-message">Message</Label>
                        <Textarea
                          id="claim-message"
                          value={claimForm.message}
                          onChange={(e) =>
                            setClaimForm((s) => ({
                              ...s,
                              message: e.target.value,
                            }))
                          }
                          placeholder="Hi, I think this is mine. I lost it on the way to the library last Tuesday…"
                          rows={3}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="claim-proof">
                          Proof of ownership
                          <span className="text-muted-foreground">
                            {" "}
                            (describe unique features)
                          </span>
                        </Label>
                        <Textarea
                          id="claim-proof"
                          value={claimForm.proof}
                          onChange={(e) =>
                            setClaimForm((s) => ({ ...s, proof: e.target.value }))
                          }
                          placeholder="E.g. the back has my name etched in blue pen, the lock screen shows a photo of…"
                          rows={3}
                          required
                        />
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setClaimOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={submitting}>
                          {submitting ? "Submitting…" : "Submit claim"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              )}

              {!isMine && (
                <Dialog open={reportOpen} onOpenChange={setReportOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="lg">
                      <Flag className="h-4 w-4" />
                      Report listing
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Report this listing</DialogTitle>
                      <DialogDescription>
                        Help us keep SULOFT safe. Reports are reviewed by an admin before any action is taken.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={onSubmitReport} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="report-reason">Reason</Label>
                        <Textarea
                          id="report-reason"
                          value={reportReason}
                          onChange={(e) => setReportReason(e.target.value)}
                          placeholder="Describe why this listing should be reviewed…"
                          rows={4}
                          required
                        />
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setReportOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={submitting}>
                          {submitting ? "Sending…" : "Submit report"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {/* Safety reminder */}
            <div className="mt-4 rounded-xl border-l-2 border-amber-400 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
              <strong className="font-semibold">Stay safe:</strong> verify
              ownership with unique details before any handover. Meet in a
              public, on-campus location like the library front desk.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <div>
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="text-sm font-medium text-foreground">{value}</div>
      </div>
    </div>
  );
}
