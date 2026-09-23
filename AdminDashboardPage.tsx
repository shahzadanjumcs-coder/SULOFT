"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Bell,
  Check,
  CheckCircle2,
  ClipboardList,
  Flag,
  LayoutDashboard,
  Megaphone,
  PackageSearch,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useSuloft } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { useCategories } from "@/lib/use-categories";
import {
  fetchItems,
  fetchAllClaims,
  fetchAllReports,
  fetchAllProfiles,
  fetchAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  deleteItem,
  approveClaim,
  rejectClaim,
  completeClaimReturn,
  updateReportStatus,
} from "@/lib/api";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { TypeBadge, StatusBadge, ClaimStatusBadge } from "../shared/StatusBadge";
import { getIcon } from "@/lib/icons";
import { formatDate, formatRelative, initials } from "@/lib/format";
import { toast } from "sonner";
import { EmptyState } from "../shared/EmptyState";
import type {
  Announcement,
  Claim,
  Item,
  ListingReport,
  Profile,
} from "@/lib/types";

const TABS = [
  { value: "overview", label: "Overview", icon: LayoutDashboard },
  { value: "users", label: "Users", icon: Users },
  { value: "items", label: "Items", icon: PackageSearch },
  { value: "claims", label: "Claims", icon: ClipboardList },
  { value: "reports", label: "Reports", icon: Flag },
  { value: "categories", label: "Categories", icon: Settings },
  { value: "announcements", label: "Announcements", icon: Megaphone },
] as const;

export function AdminDashboardPage() {
  const { user, profile, isAdmin, loading: authLoading } = useAuth();
  const { navigate, dataVersion, bumpDataVersion } = useSuloft();
  const categories = useCategories();
  const [tab, setTab] = useState<(typeof TABS)[number]["value"]>("overview");

  const [items, setItems] = useState<Item[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [reports, setReports] = useState<ListingReport[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyClaimId, setBusyClaimId] = useState<string | null>(null);

  // Admin-only data fetch. Even though the UI hides the Admin button for
  // non-admins, RLS policies will REJECT these queries if a non-admin somehow
  // reaches this code — Supabase returns an empty result or an error, not the
  // restricted data.
  useEffect(() => {
    let active = true;
    if (!user || !isAdmin || !isSupabaseConfigured) {
      Promise.resolve().then(() => {
        if (active) setLoading(false);
      });
      return;
    }
    (async () => {
      setLoading(true);
      // For admin view, fetch ALL items regardless of status by using
      // includeStatuses (RLS still restricts to what this user can see,
      // which for an admin is everything).
      const [itemsRes, claimsRes, reportsRes, profilesRes, annRes] =
        await Promise.all([
          fetchItems({
            includeStatuses: [
              "active",
              "claimed",
              "returned",
              "expired",
              "removed",
            ],
            limit: 200,
          }),
          fetchAllClaims(),
          fetchAllReports(),
          fetchAllProfiles(),
          fetchAnnouncements(),
        ]);
      if (!active) return;
      setItems(itemsRes.data ?? []);
      setClaims(claimsRes.data ?? []);
      setReports(reportsRes.data ?? []);
      setProfiles(profilesRes.data ?? []);
      setAnnouncements(annRes.data ?? []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [user, isAdmin, dataVersion]);

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <ShieldCheck className="mx-auto h-12 w-12 text-muted-foreground" />
        <h1 className="mt-4 font-display text-2xl font-bold">
          Connect Supabase to enable the admin dashboard
        </h1>
        <p className="mt-2 text-muted-foreground">
          Add your Supabase credentials to .env.local — see SETUP.md for instructions.
        </p>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-4">
          <div className="h-12 w-1/3 rounded bg-muted" />
          <div className="grid grid-cols-3 gap-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-muted" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <ShieldCheck className="mx-auto h-12 w-12 text-muted-foreground" />
        <h1 className="mt-4 font-display text-2xl font-bold">Admin access only</h1>
        <p className="mt-2 text-muted-foreground">
          You need an admin account to view this page.
        </p>
        <Button onClick={() => navigate("login")} className="mt-6">
          Sign in as admin
        </Button>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <ShieldCheck className="mx-auto h-12 w-12 text-muted-foreground" />
        <h1 className="mt-4 font-display text-2xl font-bold">
          You don&apos;t have admin access
        </h1>
        <p className="mt-2 text-muted-foreground">
          Your account ({profile?.role || "student"}) is not authorised to view the admin dashboard. If you believe this is an error, ask another admin to upgrade your role.
        </p>
        <Button onClick={() => navigate("dashboard")} className="mt-6">
          Go to my dashboard
        </Button>
      </div>
    );
  }

  const lostItems = items.filter((i) => i.type === "lost");
  const foundItems = items.filter((i) => i.type === "found");
  const returnedItems = items.filter((i) => i.status === "returned");
  const pendingClaims = claims.filter((c) => c.status === "pending");
  const pendingReports = reports.filter((r) => r.status === "pending");

  const STATS = [
    { label: "Total users", value: profiles.length, icon: Users, accent: "text-blue-600 bg-blue-500/10" },
    { label: "Lost reports", value: lostItems.length, icon: Sparkles, accent: "text-red-600 bg-red-500/10" },
    { label: "Found reports", value: foundItems.length, icon: PackageSearch, accent: "text-emerald-600 bg-emerald-500/10" },
    { label: "Pending approvals", value: pendingClaims.length + pendingReports.length, icon: AlertTriangle, accent: "text-amber-600 bg-amber-500/10" },
    { label: "Total claims", value: claims.length, icon: ClipboardList, accent: "text-primary bg-primary/10" },
    { label: "Returned items", value: returnedItems.length, icon: CheckCircle2, accent: "text-emerald-600 bg-emerald-500/10" },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header band */}
      <section className="border-b bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <ShieldCheck className="h-5 w-5" strokeWidth={2} />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Admin Dashboard
              </span>
              <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Portal management
              </h1>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="w-full">
            <div className="overflow-x-auto scroll-area-pretty">
              <TabsList className="mb-6 inline-flex w-auto">
                {TABS.map((t) => (
                  <TabsTrigger key={t.value} value={t.value} className="gap-1.5">
                    <t.icon className="h-3.5 w-3.5" />
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Overview */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
                {STATS.map((s) => (
                  <Card key={s.label}>
                    <CardContent className="p-4">
                      <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", s.accent)}>
                        <s.icon className="h-4 w-4" />
                      </div>
                      <div className="mt-3 font-display text-2xl font-bold">
                        {loading ? "…" : s.value}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{s.label}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* Pending approvals */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      Pending approvals
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {pendingClaims.length === 0 && pendingReports.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        All caught up — no pending approvals.
                      </p>
                    ) : (
                      <>
                        {pendingClaims.map((c) => {
                          const item = items.find((i) => i.id === c.item_id);
                          const claimant = profiles.find((p) => p.id === c.claimant_id);
                          return (
                            <div key={c.id} className="rounded-xl border p-3 text-sm">
                              <div className="font-medium">
                                Claim on &ldquo;{item?.title || "Unknown"}&rdquo;
                              </div>
                              <div className="text-muted-foreground">
                                By {claimant?.full_name || "Unknown"} · {formatRelative(c.created_at)}
                              </div>
                            </div>
                          );
                        })}
                        {pendingReports.map((r) => {
                          const item = items.find((i) => i.id === r.item_id);
                          return (
                            <div key={r.id} className="rounded-xl border border-amber-300/40 bg-amber-50 p-3 text-sm dark:bg-amber-500/10">
                              <div className="font-medium">
                                Report on &ldquo;{item?.title || "Unknown"}&rdquo;
                              </div>
                              <div className="text-muted-foreground line-clamp-1">
                                {r.reason}
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Recent activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Bell className="h-4 w-4 text-primary" />
                      Latest portal activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {items.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No items yet.</p>
                    ) : (
                      items.slice(0, 5).map((item) => {
                        const poster = profiles.find((p) => p.id === item.user_id);
                        return (
                          <div key={item.id} className="flex items-start gap-3 rounded-xl border p-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {initials(poster?.full_name || "?")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="text-sm">
                                <span className="font-medium">{poster?.full_name || "Unknown"}</span>
                                <span className="text-muted-foreground"> posted </span>
                                <span className="font-medium">{item.title}</span>
                              </div>
                              <div className="mt-0.5 flex items-center gap-2">
                                <TypeBadge type={item.type} />
                                <span className="text-xs text-muted-foreground">
                                  {formatRelative(item.created_at)}
                                </span>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => navigate("item", { itemId: item.id })}
                            >
                              View
                            </Button>
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Users */}
            <TabsContent value="users">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead className="hidden md:table-cell">Student ID</TableHead>
                        <TableHead className="hidden md:table-cell">Department</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="hidden sm:table-cell">Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {profiles.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                            No users found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        profiles.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell>
                              <div className="flex items-center gap-2.5">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                    {initials(p.full_name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{p.full_name}</div>
                                  <div className="text-xs text-muted-foreground">{p.email}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-sm">{p.student_id}</TableCell>
                            <TableCell className="hidden md:table-cell text-sm">{p.department}</TableCell>
                            <TableCell>
                              <RoleBadge role={p.role} />
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                              {formatDate(p.created_at)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  toast.info("User management", {
                                    description: `Demote or suspend ${p.full_name} via the Supabase dashboard (requires server-side service role key).`,
                                  })
                                }
                              >
                                <X className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Manage</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Items */}
            <TabsContent value="items">
              {items.length === 0 ? (
                <EmptyState
                  icon={PackageSearch}
                  title="No items reported yet"
                  description="Items reported by students will appear here."
                />
              ) : (
                <div className="space-y-3">
                  {items.map((item) => {
                    const poster = profiles.find((p) => p.id === item.user_id);
                    return (
                      <div
                        key={item.id}
                        className="flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <TypeBadge type={item.type} />
                            <StatusBadge status={item.status} />
                            <span className="text-xs text-muted-foreground">
                              Posted {formatRelative(item.created_at)}
                            </span>
                          </div>
                          <h3 className="mt-1 font-display text-base font-semibold">{item.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            By {poster?.full_name || "Unknown"} · {item.location}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate("item", { itemId: item.id })}
                          >
                            View
                          </Button>
                          {item.status === "active" && (
                            <span className="text-xs italic text-muted-foreground self-center">
                              No approved claim yet — use Claims tab
                            </span>
                          )}
                          {item.status === "claimed" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setTab("claims")}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Mark returned via claim
                            </Button>
                          )}
                          {item.status === "returned" && (
                            <span className="text-xs italic text-emerald-600 self-center">
                              Returned — closed
                            </span>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={async () => {
                              const { error } = await deleteItem(item.id);
                              if (error) {
                                toast.error("Failed to delete item", { description: error });
                              } else {
                                toast.success("Item removed", { description: item.title });
                                bumpDataVersion();
                              }
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Claims */}
            <TabsContent value="claims">
              {claims.length === 0 ? (
                <EmptyState
                  icon={ClipboardList}
                  title="No claims submitted yet"
                  description="Claims submitted by students will appear here."
                />
              ) : (
                <div className="space-y-3">
                  {claims.map((c) => {
                    const item = items.find((i) => i.id === c.item_id);
                    const claimant = profiles.find((p) => p.id === c.claimant_id);
                    return (
                      <div key={c.id} className="rounded-2xl border bg-card p-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <ClaimStatusBadge status={c.status} />
                              {item && <TypeBadge type={item.type} />}
                            </div>
                            <h3 className="mt-1 font-display text-base font-semibold">
                              Claim on &ldquo;{item?.title || "Unknown item"}&rdquo;
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              By {claimant?.full_name || "Unknown"} · {formatRelative(c.created_at)}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {c.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  disabled={busyClaimId === c.id}
                                  onClick={async () => {
                                    setBusyClaimId(c.id);
                                    try {
                                      const { error } = await approveClaim(c.id);
                                      if (error) {
                                        toast.error("Failed to approve", { description: error });
                                      } else {
                                        toast.success("Claim approved", {
                                          description: `${claimant?.full_name || "Claimant"} has been notified. Item moved to "claimed".`,
                                        });
                                        bumpDataVersion();
                                      }
                                    } finally {
                                      setBusyClaimId(null);
                                    }
                                  }}
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  {busyClaimId === c.id ? "Approving…" : "Approve"}
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      disabled={busyClaimId === c.id}
                                    >
                                      <X className="h-3.5 w-3.5" />
                                      Reject
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Reject this claim?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        {claimant?.full_name || "The claimant"} will be notified that their claim
                                        for &ldquo;{item?.title || "this item"}&rdquo; was rejected. The item
                                        will remain available for others to claim. This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        disabled={busyClaimId === c.id}
                                        onClick={async () => {
                                          setBusyClaimId(c.id);
                                          try {
                                            const { error } = await rejectClaim(c.id);
                                            if (error) {
                                              toast.error("Failed to reject", { description: error });
                                            } else {
                                              toast.success("Claim rejected", {
                                                description: `${claimant?.full_name || "Claimant"} has been notified.`,
                                              });
                                              bumpDataVersion();
                                            }
                                          } finally {
                                            setBusyClaimId(null);
                                          }
                                        }}
                                      >
                                        {busyClaimId === c.id ? "Rejecting…" : "Yes, reject claim"}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                            {c.status === "approved" && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={busyClaimId === c.id}
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    {busyClaimId === c.id ? "Completing…" : "Mark returned & complete"}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Mark this item as returned?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will mark &ldquo;{item?.title || "the item"}&rdquo; as returned,
                                      complete {claimant?.full_name || "the claimant"}&apos;s claim, and notify
                                      both the claimant and the item owner. This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      disabled={busyClaimId === c.id}
                                      onClick={async () => {
                                        setBusyClaimId(c.id);
                                        try {
                                          const { error } = await completeClaimReturn(c.id);
                                          if (error) {
                                            toast.error("Failed to complete", { description: error });
                                          } else {
                                            toast.success("Item returned & claim completed", {
                                              description: "Both parties have been notified.",
                                            });
                                            bumpDataVersion();
                                          }
                                        } finally {
                                          setBusyClaimId(null);
                                        }
                                      }}
                                    >
                                      {busyClaimId === c.id ? "Completing…" : "Yes, mark returned"}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                            {(c.status === "rejected" || c.status === "completed") && (
                              <span className="text-xs italic text-muted-foreground">
                                {c.status === "rejected"
                                  ? "No further action required"
                                  : "Returned — closed"}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 space-y-2 text-sm">
                          <div>
                            <span className="text-xs uppercase tracking-wider text-muted-foreground">Message:</span>
                            <p>{c.message}</p>
                          </div>
                          <div>
                            <span className="text-xs uppercase tracking-wider text-muted-foreground">Proof:</span>
                            <p>{c.proof}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Reports */}
            <TabsContent value="reports">
              {reports.length === 0 ? (
                <EmptyState
                  icon={Flag}
                  title="No reports submitted"
                  description="User-submitted reports about listings will appear here."
                />
              ) : (
                <div className="space-y-3">
                  {reports.map((r) => {
                    const item = items.find((i) => i.id === r.item_id);
                    return (
                      <div
                        key={r.id}
                        className="rounded-2xl border border-amber-300/40 bg-amber-50 p-4 dark:bg-amber-500/10"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-200">
                                <Flag className="h-3 w-3" />
                                {r.status}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatRelative(r.created_at)}
                              </span>
                            </div>
                            <h3 className="mt-1 font-display text-base font-semibold">
                              Report on &ldquo;{item?.title || "Unknown"}&rdquo;
                            </h3>
                            <p className="mt-1 text-sm text-muted-foreground">{r.reason}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={async () => {
                                const { error } = await updateReportStatus(r.id, "actioned");
                                if (error) toast.error("Failed to action", { description: error });
                                else {
                                  toast.success("Report actioned");
                                  bumpDataVersion();
                                }
                              }}
                            >
                              Action
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                const { error } = await updateReportStatus(r.id, "dismissed");
                                if (error) toast.error("Failed to dismiss", { description: error });
                                else {
                                  toast.success("Report dismissed");
                                  bumpDataVersion();
                                }
                              }}
                            >
                              Dismiss
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Categories */}
            <TabsContent value="categories">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((c) => {
                  const Icon = getIcon(c.icon);
                  const count = items.filter((i) => i.category_id === c.id).length;
                  return (
                    <Card key={c.id}>
                      <CardContent className="flex items-center gap-3 p-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" strokeWidth={1.75} />
                        </div>
                        <div className="flex-1">
                          <div className="font-display text-sm font-semibold">{c.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {count} {count === 1 ? "item" : "items"}
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            toast.info("Edit category", {
                              description: "Add or edit categories in the Supabase dashboard.",
                            })
                          }
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              <Button variant="outline" className="mt-4" onClick={() => toast.info("Add category", { description: "Add categories via the Supabase dashboard." })}>
                Add new category
              </Button>
            </TabsContent>

            {/* Announcements */}
            <TabsContent value="announcements">
              <AnnouncementsTab
                announcements={announcements}
                onCreated={bumpDataVersion}
                onDeleted={bumpDataVersion}
              />
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
}

function RoleBadge({ role }: { role: "student" | "staff" | "admin" }) {
  const styles = {
    admin: "bg-primary text-primary-foreground",
    staff: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
    student: "bg-secondary text-secondary-foreground",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", styles[role])}>
      {role}
    </span>
  );
}

function AnnouncementsTab({
  announcements,
  onCreated,
  onDeleted,
}: {
  announcements: Announcement[];
  onCreated: () => void;
  onDeleted: () => void;
}) {
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [saving, setSaving] = useState(false);

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newBody.trim()) {
      toast.error("Both title and body are required.");
      return;
    }
    setSaving(true);
    const { error } = await createAnnouncement(newTitle.trim(), newBody.trim(), false);
    setSaving(false);
    if (error) {
      toast.error("Failed to publish announcement", { description: error });
      return;
    }
    setNewTitle("");
    setNewBody("");
    toast.success("Announcement published");
    onCreated();
  };

  const onDelete = async (id: string) => {
    const { error } = await deleteAnnouncement(id);
    if (error) {
      toast.error("Failed to delete announcement", { description: error });
      return;
    }
    toast.success("Announcement deleted");
    onDeleted();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-base">New announcement</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onAdd} className="space-y-3">
            <input
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-ring/50"
              placeholder="Title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <textarea
              className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-ring/50"
              placeholder="Body"
              rows={4}
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
            />
            <Button type="submit" className="w-full" disabled={saving}>
              <Megaphone className="h-4 w-4" />
              {saving ? "Publishing…" : "Publish"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3 lg:col-span-2">
        {announcements.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="No announcements yet"
            description="Announcements you publish will appear here and on the home page for all users."
          />
        ) : (
          announcements.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-base font-semibold">{a.title}</h3>
                      {a.pinned && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
                          Pinned
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatDate(a.created_at)}
                    </p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => onDelete(a.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
