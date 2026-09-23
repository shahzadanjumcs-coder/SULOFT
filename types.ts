// SULOFT - Domain Types
// These types map directly to the Supabase/Postgres schema documented in /lib/supabase.ts.
// Keeping them in one place makes it trivial to swap mock data for live Supabase queries later.

export type UserRole = "student" | "staff" | "admin";

export type ItemType = "lost" | "found";

export type ItemStatus =
  | "active" // visible in browse
  | "claimed" // a claim has been approved, awaiting handover
  | "returned" // item has been returned to owner
  | "expired" // auto-archived after 90 days
  | "removed"; // taken down by admin or owner

export type ClaimStatus = "pending" | "approved" | "rejected" | "completed";

export type ReportStatus = "pending" | "reviewing" | "actioned" | "dismissed";

export type ContactPreference = "email" | "phone" | "in_app" | "dashboard_only";

// ---------- Profiles ----------
export interface Profile {
  id: string;
  full_name: string;
  email: string;
  student_id: string;
  department: string;
  role: UserRole;
  avatar_url: string | null;
  phone?: string | null;
  bio?: string | null;
  created_at: string; // ISO
}

// ---------- Categories ----------
export interface Category {
  id: string;
  name: string;
  icon: string; // lucide icon name
  description?: string;
}

// ---------- Items ----------
export interface Item {
  id: string;
  user_id: string;
  title: string;
  description: string;
  type: ItemType;
  category_id: string;
  location: string;
  date: string; // ISO date (yyyy-mm-dd)
  time?: string | null; // HH:mm
  image_url: string | null;
  image_path?: string | null; // Supabase storage path (for deletion)
  status: ItemStatus;
  contact_preference: ContactPreference;
  additional_info?: string | null;
  created_at: string; // ISO
  updated_at?: string; // ISO
  // denormalised helper fields for the UI (joined via Supabase select)
  poster?: Profile;
  category?: Category;
}

// ---------- Claims ----------
export interface Claim {
  id: string;
  item_id: string;
  claimant_id: string;
  message: string;
  proof: string; // description of ownership proof
  status: ClaimStatus;
  created_at: string;
  updated_at?: string;
  // denormalised
  item?: Item;
  claimant?: Profile;
}

// ---------- Notifications ----------
export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  type?: "info" | "success" | "warning" | "claim" | "system";
}

// ---------- Reports (flag listings) ----------
export interface ListingReport {
  id: string;
  item_id: string;
  reporter_id: string;
  reason: string;
  status: ReportStatus;
  created_at: string;
  item?: Item;
  reporter?: Profile;
}

// ---------- Announcements ----------
export interface Announcement {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  created_at: string;
}

// ---------- Auth ----------
export interface AuthUser {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  avatar_url: string | null;
}

// ---------- Navigation ----------
// Centralised route keys used by the in-app SPA router (zustand store).
export type ViewKey =
  | "home"
  | "browse"
  | "item"
  | "report-lost"
  | "report-found"
  | "about"
  | "contact"
  | "login"
  | "signup"
  | "forgot-password"
  | "reset-password"
  | "dashboard"
  | "admin";

// ---------- Form payloads ----------
export interface ReportLostPayload {
  title: string;
  category_id: string;
  description: string;
  location: string;
  date: string;
  time?: string;
  additional_info?: string;
  contact_preference: ContactPreference;
  image_url?: string;
}

export interface ReportFoundPayload {
  title: string;
  category_id: string;
  description: string;
  location: string;
  date: string;
  time?: string;
  additional_info?: string;
  contact_preference: ContactPreference;
  image_url?: string;
}

export interface ClaimPayload {
  item_id: string;
  message: string;
  proof: string;
}

export interface SignupPayload {
  full_name: string;
  email: string;
  student_id: string;
  department: string;
  password: string;
  confirm_password: string;
}
