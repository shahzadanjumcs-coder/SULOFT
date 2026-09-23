---
Task ID: supabase-integration
Agent: main
Task: Convert SULOFT from mock demo to real working Supabase application with auth, RLS, storage, and live DB queries — without changing the UI.

Work Log:
- Installed @supabase/supabase-js@2.116.0
- Created .env.local.example with NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
- Created src/lib/supabase/client.ts — browser client (anon key, safe to expose, RLS-enforced)
- Created src/lib/supabase/server.ts — server-only client (service role key, has `import "server-only"` to prevent client-side imports)
- Created supabase/schema.sql with 7 tables (profiles, categories, items, claims, notifications, reports, announcements), enums, triggers (handle_new_user auto-profile on signup, touch_updated_at, notify_item_owner_of_claim), and full RLS policies (public read active items, admin read/write all, students can only write their own data, claims visible to claimant + item owner + admin, etc.)
- Created supabase/storage.sql with item-images bucket (public read, authenticated write scoped to user_id folder, admin can delete)
- Created supabase/seed.sql with 9 categories + 2 demo announcements
- Created src/lib/auth-context.tsx — real Supabase Auth provider using getSession() + onAuthStateChange, with signIn/signUp/signOut/resetPassword/updatePassword methods
- Created src/lib/image-utils.ts — browser-side image compression (resize to 1280px max, JPEG 0.82 quality, EXIF strip) before upload
- Created src/lib/api.ts — complete Supabase query layer (items, claims, notifications, reports, profiles, announcements, storage upload/delete) using anon client so RLS is enforced on every call
- Created src/lib/use-categories.ts — hook that fetches categories from Supabase once and caches them
- Created src/lib/categories.ts — static fallback category list mirroring seed.sql
- Updated src/lib/store.ts — removed all mock auth/user data, kept only UI navigation state
- Updated src/lib/types.ts — added image_path and updated_at fields to match DB schema
- Updated src/lib/mock-data.ts — kept only campusLocations and departments static dropdowns; removed all hardcoded users/items/claims
- Updated Navbar to use useAuth() for real auth state — Admin button only shows when profile.role === 'admin'
- Updated AuthPage to use real Supabase auth (signInWithPassword, signUp with metadata for profile trigger, resetPasswordForEmail, updateUser), with email-confirmation flow handling
- Updated HomePage RecentItemsSection to fetch real items from Supabase with skeleton loading + empty state
- Updated HomePage CategoriesSection to use useCategories hook (live + fallback)
- Updated BrowsePage to use fetchItems() with real filters (search, type, category, location, sort, pagination) and Supabase count
- Updated ItemDetailsPage to fetch real item by id, submit real claims (createClaim), and submit real reports (createReport) — all RLS-enforced
- Updated ReportForm to validate, upload image to Supabase Storage (with browser-side compression), then insert real item row
- Updated UserDashboard to fetch user's real items/claims/notifications, with mark-as-read actions that call markNotificationRead/markAllNotificationsRead
- Updated AdminDashboard with real admin queries (fetchAllProfiles, fetchAllClaims, fetchAllReports, fetchAnnouncements), real admin actions (updateItemStatus, updateClaimStatus, updateReportStatus, deleteItem, createAnnouncement, deleteAnnouncement). Three layers of admin protection: UI hides button + auth-context checks role + RLS rejects DB queries from non-admins.
- Created SetupBanner component showing "Supabase not configured" warning when env vars are missing
- Updated layout.tsx to wrap entire app in AuthProvider and render SetupBanner at top
- Updated page.tsx to detect Supabase password-recovery redirect (auto-routes to reset-password view)
- Created SETUP.md with comprehensive setup instructions: Supabase project creation, finding API keys, env var configuration, schema/storage/seed SQL execution order, RLS policy table, first-admin SQL promotion, local dev, Vercel deployment, security checklist, troubleshooting, and what-changed-from-mock table

Stage Summary:
- All SULOFT code now uses real Supabase APIs — no mock auth, no fake data, no service-role keys in client code
- Security model: anon key in browser (RLS-enforced) + service role server-only + role-based UI + RLS policies + admin role check in auth-context + DB triggers for profile auto-creation and claim notifications
- Files created: .env.local.example, SETUP.md, supabase/schema.sql, supabase/storage.sql, supabase/seed.sql, src/lib/supabase/client.ts, src/lib/supabase/server.ts, src/lib/auth-context.tsx, src/lib/api.ts, src/lib/image-utils.ts, src/lib/use-categories.ts, src/lib/categories.ts, src/components/suloft/shared/SetupBanner.tsx
- Files updated: src/lib/store.ts, src/lib/types.ts, src/lib/mock-data.ts, src/lib/supabase.ts, src/app/layout.tsx, src/app/page.tsx, src/components/suloft/layout/Navbar.tsx, src/components/suloft/auth/AuthPage.tsx, src/components/suloft/home/CategoriesSection.tsx, src/components/suloft/home/RecentItemsSection.tsx, src/components/suloft/browse/BrowsePage.tsx, src/components/suloft/item/ItemDetailsPage.tsx, src/components/suloft/report/ReportForm.tsx, src/components/suloft/dashboard/UserDashboardPage.tsx, src/components/suloft/dashboard/AdminDashboardPage.tsx, src/components/suloft/shared/ItemImage.tsx, src/components/suloft/shared/ItemCard.tsx
- Lint passes cleanly (eslint .)
- TypeScript type-check passes cleanly (tsc --noEmit) for all SULOFT code
- Agent Browser verifies: app loads correctly with SetupBanner when env vars missing, navbar shows Login (not Admin/Dashboard) for unauthenticated users, Browse page shows "Connect Supabase to browse items" empty state, Sign in button is disabled on AuthPage until Supabase is configured, zero browser console errors
- Dev server returns 200 in <120ms
- Project remains deployable to Vercel — only env var additions needed
