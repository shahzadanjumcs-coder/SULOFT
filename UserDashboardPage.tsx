"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  CheckCircle2,
  ClipboardList,
  LayoutDashboard,
  PackageSearch,
  Settings,
  Sparkles,
  User,
  PackageCheck,
  Mail,
  Phone,
  IdCard,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSuloft } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import {
  fetchItems,
  fetchClaimsForUser,
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  updateProfile,
} from "@/lib/api";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { Claim, Item, NotificationItem, Profile } from "@/lib/types";
import { ItemCard } from "../shared/ItemCard";
import { EmptyState } from "../shared/EmptyState";
import { ClaimStatusBadge, TypeBadge } from "../shared/StatusBadge";
import { formatDateTime, formatRelative, initials } from "@/lib/format";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const TABS = [
  { value: "overview", label: "Overview", icon: LayoutDashboard },
  { value: "lost", label: "Lost Reports", icon: Sparkles },
  { value: "found", label: "Found Reports", icon: PackageSearch },
  { value: "claims", label: "My Claims", icon: ClipboardList },
  { value: "notifications", label: "Notifications", icon: Bell },
  { value: "settings", label: "Settings", icon: Settings },
] as const;

export function UserDashboardPage() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const { navigate, dataVersion, bumpDataVersion } = useSuloft();
  const [tab, setTab] = useState<(typeof TABS)[number]["value"]>("overview");

  const [items, setItems] = useState<Item[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user data
  useEffect(() => {
    let active = true;
    if (!user || !isSupabaseConfigured) {
      Promise.resolve().then(() => {
        if (active) setLoading(false);
      });
      return;
    }
    (async () => {
      setLoading(true);
      const [itemsRes, claimsRes, notifsRes] = await Promise.all([
        fetchItems({ ownerId: user.id, limit: 100 }),
        fetchClaimsForUser(user.id),
        fetchNotifications(user.id),
      ]);
      if (!active) return;
      setItems(itemsRes.data ?? []);
      setClaims(claimsRes.data ?? []);
      setNotifications(notifsRes.data ?? []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [user, dataVersion]);

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <EmptyState
          icon={Settings}
          title="Connect Supabase to use your dashboard"
          description="Add your Supabase credentials to .env.local — see SETUP.md for instructions."
        />
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-4">
          <div className="h-14 w-1/3 rounded-2xl bg-muted" />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
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
        <h1 className="font-display text-2xl font-bold">Please sign in</h1>
        <p className="mt-2 text-muted-foreground">
          You need to be signed in to view your dashboard.
        </p>
        <Button onClick={() => navigate("login")} className="mt-6">
          Sign in
        </Button>
      </div>
    );
  }

  const myLost = items.filter((i) => i.type === "lost");
  const myFound = items.filter((i) => i.type === "found");
  const myReturned = items.filter((i) => i.status === "returned");
  const unreadCount = notifications.filter((n) => !n.read).length;

  const STATS = [
    { label: "Lost reports", value: myLost.length, icon: Sparkles, tone: "lost" as const },
    { label: "Found reports", value: myFound.length, icon: PackageSearch, tone: "found" as const },
    {
      label: "Active claims",
      value: claims.filter((c) => c.status === "pending" || c.status === "approved").length,
      icon: ClipboardList,
      tone: "neutral" as const,
    },
    { label: "Returned items", value: myReturned.length, icon: PackageCheck, tone: "success" as const },
  ];

  const handleMarkRead = async (id: string) => {
    const { error } = await markNotificationRead(id);
    if (error) {
      toast.error("Could not mark notification as read", { description: error });
      return;
    }
    setNotifications((ns) =>
      ns.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    const { error } = await markAllNotificationsRead(user.id);
    if (error) {
      toast.error("Could not mark all as read", { description: error });
      return;
    }
    setNotifications((ns) => ns.map((n) => ({ ...n, read: true })));
    toast.success("All notifications marked as read");
  };

  return (
    <div className="animate-fade-in">
      {/* Header band */}
      <section className="border-b bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 border shadow-sm">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {initials(profile?.full_name || user.email || "U")}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                  Hello, {profile?.full_name?.split(" ")[0] || user.email?.split("@")[0]}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {profile?.department || "—"} · {profile?.student_id || "—"}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => navigate("report-lost")} variant="outline">
                <Sparkles className="h-4 w-4" />
                Report lost
              </Button>
              <Button onClick={() => navigate("report-found")}>
                <PackageSearch className="h-4 w-4" />
                Report found
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="rounded-2xl border bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {s.label}
                  </span>
                  <div
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-lg",
                      s.tone === "lost" && "bg-red-500/10 text-red-600",
                      s.tone === "found" && "bg-emerald-500/10 text-emerald-600",
                      s.tone === "neutral" && "bg-blue-500/10 text-blue-600",
                      s.tone === "success" && "bg-primary/10 text-primary"
                    )}
                  >
                    <s.icon className="h-3.5 w-3.5" />
                  </div>
                </div>
                <div className="mt-2 font-display text-3xl font-bold">
                  {loading ? "…" : s.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="w-full">
            <div className="overflow-x-auto scroll-area-pretty">
              <TabsList className="mb-6 inline-flex w-auto">
                {TABS.map((t) => (
                  <TabsTrigger key={t.value} value={t.value} className="gap-1.5">
                    <t.icon className="h-3.5 w-3.5" />
                    {t.label}
                    {t.value === "notifications" && unreadCount > 0 && (
                      <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                        {unreadCount}
                      </span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Overview */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Profile */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <User className="h-4 w-4 text-primary" />
                      Profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <InfoRow icon={IdCard} label="Student ID" value={profile?.student_id || "—"} />
                    <InfoRow icon={Building2} label="Department" value={profile?.department || "—"} />
                    <InfoRow icon={Mail} label="Email" value={profile?.email || user.email || "—"} />
                    <InfoRow icon={Phone} label="Phone" value={profile?.phone || "Not provided"} />
                  </CardContent>
                </Card>

                {/* Recent notifications */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-base">
                      <span className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-primary" />
                        Recent notifications
                      </span>
                      <Button size="sm" variant="ghost" onClick={() => setTab("notifications")}>
                        View all
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {notifications.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        You have no notifications yet.
                      </p>
                    ) : (
                      notifications.slice(0, 3).map((n) => (
                        <NotificationRow key={n.id} n={n} onRead={() => handleMarkRead(n.id)} />
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Recent items */}
              <div>
                <h2 className="font-display text-lg font-semibold">My recent listings</h2>
                {items.length === 0 ? (
                  <EmptyState
                    className="mt-4"
                    icon={PackageSearch}
                    title="You haven't posted anything yet"
                    description="Report a lost or found item to see it here."
                    action={{
                      label: "Report an item",
                      onClick: () => navigate("report-lost"),
                    }}
                  />
                ) : (
                  <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {items.slice(0, 4).map((item) => (
                      <ItemCard key={item.id} item={item} />
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Lost */}
            <TabsContent value="lost">
              {myLost.length === 0 ? (
                <EmptyState
                  icon={Sparkles}
                  title="No lost reports yet"
                  description="When you report a lost item, it will appear here."
                  action={{
                    label: "Report a lost item",
                    onClick: () => navigate("report-lost"),
                  }}
                />
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {myLost.map((item) => (
                    <ItemCard key={item.id} item={item} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Found */}
            <TabsContent value="found">
              {myFound.length === 0 ? (
                <EmptyState
                  icon={PackageSearch}
                  title="No found reports yet"
                  description="When you report a found item, it will appear here."
                  action={{
                    label: "Report a found item",
                    onClick: () => navigate("report-found"),
                  }}
                />
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {myFound.map((item) => (
                    <ItemCard key={item.id} item={item} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Claims */}
            <TabsContent value="claims">
              {claims.length === 0 ? (
                <EmptyState
                  icon={ClipboardList}
                  title="No claims submitted"
                  description="When you claim an item, you'll be able to track its status here."
                  action={{
                    label: "Browse items",
                    onClick: () => navigate("browse"),
                  }}
                />
              ) : (
                <div className="space-y-3">
                  {claims.map((c) => {
                    const item = items.find((i) => i.id === c.item_id) || c.item;
                    return (
                      <div
                        key={c.id}
                        className="flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {item && <TypeBadge type={item.type} />}
                            <span className="text-xs text-muted-foreground">
                              Submitted {formatRelative(c.created_at)}
                            </span>
                          </div>
                          <h3 className="mt-1 font-display text-base font-semibold">
                            {item?.title || "Unknown item"}
                          </h3>
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                            {c.message}
                          </p>
                          <div className="mt-2 text-xs">
                            <span className="text-muted-foreground">Proof:</span>{" "}
                            <span>{c.proof}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-start gap-2 sm:items-end">
                          <ClaimStatusBadge status={c.status} />
                          {item && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate("item", { itemId: item.id })}
                            >
                              View item
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Notifications */}
            <TabsContent value="notifications">
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllRead}
                  disabled={unreadCount === 0}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Mark all as read
                </Button>
              </div>
              <div className="mt-3 space-y-3">
                {notifications.length === 0 ? (
                  <EmptyState
                    icon={Bell}
                    title="You're all caught up"
                    description="New notifications about your items and claims will appear here."
                  />
                ) : (
                  notifications.map((n) => (
                    <NotificationRow
                      key={n.id}
                      n={n}
                      onRead={() => handleMarkRead(n.id)}
                    />
                  ))
                )}
              </div>
            </TabsContent>

            {/* Settings */}
            <TabsContent value="settings">
              <SettingsTab
                key={profile?.id || "no-profile"}
                profile={profile || undefined}
                userId={user.id}
                onSaved={async () => {
                  await refreshProfile();
                  bumpDataVersion();
                }}
              />
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="text-sm font-medium text-foreground">{value}</div>
      </div>
    </div>
  );
}

function NotificationRow({
  n,
  onRead,
}: {
  n: NotificationItem;
  onRead: () => void;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-3 transition-colors",
        n.read ? "bg-card" : "border-primary/40 bg-primary/5"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-display text-sm font-semibold">{n.title}</span>
            {!n.read && (
              <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary-foreground">
                New
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {formatDateTime(n.created_at)}
          </p>
        </div>
        {!n.read && (
          <Button size="sm" variant="ghost" onClick={onRead}>
            Mark read
          </Button>
        )}
      </div>
    </div>
  );
}

function SettingsTab({
  profile,
  userId,
  onSaved,
}: {
  profile?: Profile;
  userId: string;
  onSaved: () => Promise<void>;
}) {
  // Use a "key" trick: when profile changes, the parent passes a different
  // child key, which remounts this component and re-initialises the state
  // from the new props. This avoids the setState-in-effect anti-pattern.
  const [name, setName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [saving, setSaving] = useState(false);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await updateProfile(userId, {
      full_name: name,
      phone,
      bio,
    });
    setSaving(false);
    if (error) {
      toast.error("Could not save profile", { description: error });
      return;
    }
    toast.success("Profile updated successfully");
    await onSaved();
  };

  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={profile?.email || ""} disabled />
              <p className="text-xs text-muted-foreground">
                Email changes require admin verification.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="sid">Student ID</Label>
                <Input id="sid" value={profile?.student_id || ""} disabled />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dep">Department</Label>
                <Input id="dep" value={profile?.department || ""} disabled />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Your contact number (optional)" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell other SULOFT members a little about yourself…" />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start">
            Change password
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start text-destructive hover:text-destructive"
          >
            Delete account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
