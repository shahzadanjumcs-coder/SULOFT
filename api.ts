// SULOFT — Supabase Query Helpers
// -----------------------------------------------------------------------------
// The single API surface the rest of the app uses to talk to Supabase.
// Every function here uses the browser (anon-key) client, which means RLS is
// enforced on every single call. If a student tries to do something admin-only,
// Postgres will reject it at the database level — not just hide the UI.
//
// Each helper returns `{ data, error }` so callers can render error states.
// -----------------------------------------------------------------------------

import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import type {
  Announcement,
  Category,
  Claim,
  Item,
  ListingReport,
  NotificationItem,
  Profile,
} from "@/lib/types";

// ----------------------------- Categories ----------------------------------
export async function fetchCategories(): Promise<{
  data: Category[] | null;
  error: string | null;
}> {
  if (!isSupabaseConfigured) return { data: null, error: "Supabase not configured" };
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");
  if (error) return { data: null, error: error.message };
  return { data: data as Category[], error: null };
}

// ----------------------------- Items --------------------------------------
export interface ItemQueryFilters {
  search?: string;
  type?: "lost" | "found" | "all";
  categoryId?: string;
  location?: string;
  sort?: "newest" | "oldest" | "title";
  limit?: number;
  offset?: number;
  // when set, only return this user's items
  ownerId?: string;
  // when set, override the default "active only" filter to include other statuses
  includeStatuses?: string[];
}

export async function fetchItems(
  filters: ItemQueryFilters = {}
): Promise<{ data: Item[] | null; error: string | null; count: number | null }> {
  if (!isSupabaseConfigured) return { data: null, error: "Supabase not configured", count: null };

  let query = supabase
    .from("items")
    .select("*, category:categories(*), poster:profiles!items_user_id_fkey(*)", {
      count: "exact",
    });

  // Status filter
  if (filters.includeStatuses && filters.includeStatuses.length > 0) {
    query = query.in("status", filters.includeStatuses);
  } else if (filters.ownerId) {
    // owner viewing their own items — show all their items regardless of status
    query = query.eq("user_id", filters.ownerId);
  } else {
    // public browse — only active items (RLS also enforces this)
    query = query.eq("status", "active");
  }

  if (filters.ownerId) query = query.eq("user_id", filters.ownerId);
  if (filters.type && filters.type !== "all")
    query = query.eq("type", filters.type);
  if (filters.categoryId && filters.categoryId !== "all")
    query = query.eq("category_id", filters.categoryId);
  if (filters.location && filters.location !== "all")
    query = query.ilike("location", `${filters.location}%`);
  if (filters.search && filters.search.trim()) {
    const q = filters.search.trim();
    query = query.or(
      `title.ilike.%${q}%,description.ilike.%${q}%,location.ilike.%${q}%`
    );
  }

  // Sort
  const sort = filters.sort || "newest";
  if (sort === "title") {
    query = query.order("title", { ascending: true });
  } else {
    query = query.order("created_at", { ascending: sort === "oldest" });
  }

  if (filters.limit) query = query.limit(filters.limit);
  if (filters.offset) query = query.range(
    filters.offset,
    filters.offset + (filters.limit || 12) - 1
  );

  const { data, error, count } = await query;
  if (error) return { data: null, error: error.message, count: null };
  return { data: data as Item[], error: null, count };
}

export async function fetchItemById(
  id: string
): Promise<{ data: Item | null; error: string | null }> {
  if (!isSupabaseConfigured) return { data: null, error: "Supabase not configured" };
  const { data, error } = await supabase
    .from("items")
    .select("*, category:categories(*), poster:profiles!items_user_id_fkey(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) return { data: null, error: error.message };
  return { data: data as Item | null, error: null };
}

export interface CreateItemInput {
  title: string;
  description: string;
  type: "lost" | "found";
  category_id: string;
  location: string;
  date: string;
  time?: string | null;
  image_url?: string | null;
  image_path?: string | null;
  contact_preference: "email" | "phone" | "in_app" | "dashboard_only";
  additional_info?: string | null;
}

export async function createItem(
  input: CreateItemInput
): Promise<{ data: Item | null; error: string | null }> {
  if (!isSupabaseConfigured) return { data: null, error: "Supabase not configured" };
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return { data: null, error: "You must be signed in to report an item." };
  }
  const { data, error } = await supabase
    .from("items")
    .insert({
      user_id: userData.user.id,
      title: input.title,
      description: input.description,
      type: input.type,
      category_id: input.category_id,
      location: input.location,
      date: input.date,
      time: input.time ?? null,
      image_url: input.image_url ?? null,
      image_path: input.image_path ?? null,
      contact_preference: input.contact_preference,
      additional_info: input.additional_info ?? null,
      status: "active",
    })
    .select("*")
    .single();
  if (error) return { data: null, error: error.message };
  return { data: data as Item, error: null };
}

export async function updateItemStatus(
  itemId: string,
  status: Item["status"]
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured) return { error: "Supabase not configured" };
  const { error } = await supabase
    .from("items")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", itemId);
  return { error: error?.message ?? null };
}

export async function deleteItem(itemId: string): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured) return { error: "Supabase not configured" };
  const { error } = await supabase.from("items").delete().eq("id", itemId);
  return { error: error?.message ?? null };
}

// ----------------------------- Claims -------------------------------------
export async function fetchClaimsForUser(
  userId: string
): Promise<{ data: Claim[] | null; error: string | null }> {
  if (!isSupabaseConfigured) return { data: null, error: "Supabase not configured" };
  const { data, error } = await supabase
    .from("claims")
    .select("*, item:items(*), claimant:profiles!claims_claimant_id_fkey(*)")
    .eq("claimant_id", userId)
    .order("created_at", { ascending: false });
  if (error) return { data: null, error: error.message };
  return { data: data as Claim[], error: null };
}

export async function fetchClaimsForItem(
  itemId: string
): Promise<{ data: Claim[] | null; error: string | null }> {
  if (!isSupabaseConfigured) return { data: null, error: "Supabase not configured" };
  const { data, error } = await supabase
    .from("claims")
    .select("*, claimant:profiles!claims_claimant_id_fkey(*)")
    .eq("item_id", itemId)
    .order("created_at", { ascending: false });
  if (error) return { data: null, error: error.message };
  return { data: data as Claim[], error: null };
}

export async function fetchAllClaims(): Promise<{
  data: Claim[] | null;
  error: string | null;
}> {
  if (!isSupabaseConfigured) return { data: null, error: "Supabase not configured" };
  const { data, error } = await supabase
    .from("claims")
    .select("*, item:items(*), claimant:profiles!claims_claimant_id_fkey(*)")
    .order("created_at", { ascending: false });
  if (error) return { data: null, error: error.message };
  return { data: data as Claim[], error: null };
}

export interface CreateClaimInput {
  item_id: string;
  message: string;
  proof: string;
}

export async function createClaim(
  input: CreateClaimInput
): Promise<{ data: Claim | null; error: string | null }> {
  if (!isSupabaseConfigured) return { data: null, error: "Supabase not configured" };
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return { data: null, error: "You must be signed in to submit a claim." };
  }
  const { data, error } = await supabase
    .from("claims")
    .insert({
      item_id: input.item_id,
      claimant_id: userData.user.id,
      message: input.message,
      proof: input.proof,
      status: "pending",
    })
    .select("*")
    .single();
  if (error) return { data: null, error: error.message };
  return { data: data as Claim, error: null };
}

export async function updateClaimStatus(
  claimId: string,
  status: Claim["status"]
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured) return { error: "Supabase not configured" };
  const { error } = await supabase
    .from("claims")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", claimId);
  return { error: error?.message ?? null };
}

// ---------------------------------------------------------------------------
// Higher-level claim lifecycle helpers.
//
// These wrap updateClaimStatus with the specific transitions defined in the
// DB trigger `guard_claim_status_transition`. The DB trigger enforces:
//   pending → approved | rejected
//   approved → completed
//   rejected → (terminal)
//   completed → (terminal)
//
// Side-effects (handled by DB trigger `on_claim_status_change`):
//   approval  → item becomes 'claimed', other pending claims auto-rejected,
//               claimant gets a notification
//   rejection → claimant gets a notification
//   completion→ item becomes 'returned', claimant + owner get notifications
// ---------------------------------------------------------------------------

export async function approveClaim(
  claimId: string
): Promise<{ error: string | null }> {
  return updateClaimStatus(claimId, "approved");
}

export async function rejectClaim(
  claimId: string
): Promise<{ error: string | null }> {
  return updateClaimStatus(claimId, "rejected");
}

export async function completeClaimReturn(
  claimId: string
): Promise<{ error: string | null }> {
  return updateClaimStatus(claimId, "completed");
}

// ----------------------------- Reports ------------------------------------
export async function fetchAllReports(): Promise<{
  data: ListingReport[] | null;
  error: string | null;
}> {
  if (!isSupabaseConfigured) return { data: null, error: "Supabase not configured" };
  const { data, error } = await supabase
    .from("reports")
    .select("*, item:items(*), reporter:profiles!reports_reporter_id_fkey(*)")
    .order("created_at", { ascending: false });
  if (error) return { data: null, error: error.message };
  return { data: data as ListingReport[], error: null };
}

export async function createReport(
  itemId: string,
  reason: string
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured) return { error: "Supabase not configured" };
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return { error: "You must be signed in to report a listing." };
  }
  const { error } = await supabase.from("reports").insert({
    item_id: itemId,
    reporter_id: userData.user.id,
    reason,
    status: "pending",
  });
  return { error: error?.message ?? null };
}

export async function updateReportStatus(
  reportId: string,
  status: ListingReport["status"]
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured) return { error: "Supabase not configured" };
  const { error } = await supabase
    .from("reports")
    .update({ status })
    .eq("id", reportId);
  return { error: error?.message ?? null };
}

// ----------------------------- Notifications ------------------------------
export async function fetchNotifications(
  userId: string
): Promise<{ data: NotificationItem[] | null; error: string | null }> {
  if (!isSupabaseConfigured) return { data: null, error: "Supabase not configured" };
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) return { data: null, error: error.message };
  return { data: data as NotificationItem[], error: null };
}

export async function markNotificationRead(
  id: string
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured) return { error: "Supabase not configured" };
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", id);
  return { error: error?.message ?? null };
}

export async function markAllNotificationsRead(
  userId: string
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured) return { error: "Supabase not configured" };
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);
  return { error: error?.message ?? null };
}

// ----------------------------- Profiles -----------------------------------
export async function fetchAllProfiles(): Promise<{
  data: Profile[] | null;
  error: string | null;
}> {
  if (!isSupabaseConfigured) return { data: null, error: "Supabase not configured" };
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return { data: null, error: error.message };
  return { data: data as Profile[], error: null };
}

export async function updateProfile(
  userId: string,
  updates: Partial<Pick<Profile, "full_name" | "phone" | "bio" | "avatar_url">>
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured) return { error: "Supabase not configured" };
  const { error } = await supabase
    .from("profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", userId);
  return { error: error?.message ?? null };
}

// ----------------------------- Announcements ------------------------------
export async function fetchAnnouncements(): Promise<{
  data: Announcement[] | null;
  error: string | null;
}> {
  if (!isSupabaseConfigured) return { data: null, error: "Supabase not configured" };
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return { data: null, error: error.message };
  return { data: data as Announcement[], error: null };
}

export async function createAnnouncement(
  title: string,
  body: string,
  pinned = false
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured) return { error: "Supabase not configured" };
  const { error } = await supabase
    .from("announcements")
    .insert({ title, body, pinned });
  return { error: error?.message ?? null };
}

export async function deleteAnnouncement(id: string): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured) return { error: "Supabase not configured" };
  const { error } = await supabase.from("announcements").delete().eq("id", id);
  return { error: error?.message ?? null };
}

// ----------------------------- Storage ------------------------------------
export async function uploadItemImage(
  userId: string,
  file: File
): Promise<{ url: string | null; path: string | null; error: string | null }> {
  if (!isSupabaseConfigured) return { url: null, path: null, error: "Supabase not configured" };

  const { optimiseImage, buildImagePath, validateImageFile } = await import(
    "@/lib/image-utils"
  );
  const validationError = validateImageFile(file);
  if (validationError) return { url: null, path: null, error: validationError };

  const optimised = await optimiseImage(file);
  const path = buildImagePath(userId, optimised.fileName);
  const uploadFile = new File([optimised.blob], optimised.fileName, {
    type: "image/jpeg",
  });

  const { error: uploadError } = await supabase.storage
    .from("item-images")
    .upload(path, uploadFile, { cacheControl: "3600", upsert: false });
  if (uploadError) return { url: null, path: null, error: uploadError.message };

  const { data: pub } = supabase.storage.from("item-images").getPublicUrl(path);
  return { url: pub.publicUrl, path, error: null };
}

export async function deleteItemImage(path: string): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured) return { error: "Supabase not configured" };
  const { error } = await supabase.storage.from("item-images").remove([path]);
  return { error: error?.message ?? null };
}
