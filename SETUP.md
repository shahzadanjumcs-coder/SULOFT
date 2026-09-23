# SULOFT — Setup Guide

Complete, step-by-step instructions for turning the SULOFT frontend into a **real** working application with Supabase authentication, a Postgres database with Row Level Security, and secure image storage.

---

## 0. Prerequisites

- A [Supabase](https://supabase.com) account (free tier is fine).
- Node.js 20+ and Bun (or npm/pnpm) installed locally.
- A Vercel account (for deployment).

---

## 1. Create a Supabase project

1. Go to <https://app.supabase.com> and sign in.
2. Click **New project**.
3. Pick an organisation, then:
   - **Name**: `suloft`
   - **Database password**: choose a strong password and save it somewhere safe.
   - **Region**: pick the one closest to your users (e.g. `Singapore` for South Asia).
4. Click **Create new project**. Wait ~2 minutes for provisioning.

---

## 2. Find your project URL and anon key

1. In your Supabase project, click the **⚙ gear icon** (Project Settings) in the bottom-left.
2. Open **API**.
3. You will see:
   - **Project URL** — looks like `https://abcdefgh.supabase.co`
   - **Project API keys** → **anon public** — a long string starting with `eyJ...`
   - **Project API keys** → **service_role** — a longer string starting with `eyJ...` (KEEP SECRET)

You'll need all three values below.

---

## 3. Configure environment variables

In the project root, copy the example file:

```bash
cp .env.local.example .env.local
```

Open `.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...your-anon-key...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...your-service-role-key...
DATABASE_URL=file:/home/z/my-project/db/custom.db
```

Rules:

- `NEXT_PUBLIC_*` variables are exposed to the browser. **Only** the anon/publishable key goes here. The anon key is designed to be public — it cannot bypass Row Level Security.
- `SUPABASE_SERVICE_ROLE_KEY` is **server-only**. It can bypass RLS, so it must never appear in client-side code. SULOFT imports it only from `src/lib/supabase/server.ts`, which has `import "server-only"` to prevent accidental client use.
- Restart your dev server after editing `.env.local`.

---

## 4. Create the database

SULOFT ships with three SQL files in the `supabase/` folder. Run them in this exact order using the Supabase SQL Editor (Dashboard → SQL Editor → New query → paste → Run):

1. **`supabase/schema.sql`** — creates all tables (`profiles`, `categories`, `items`, `claims`, `notifications`, `reports`, `announcements`), enums, triggers, and RLS policies.
2. **`supabase/storage.sql`** — creates the `item-images` storage bucket and its RLS policies.
3. **`supabase/seed.sql`** (optional but recommended) — inserts the 9 default categories and 2 demo announcements.

You can run all three back-to-back; each is idempotent.

### What the RLS policies enforce

| Table           | Public read | Authenticated read              | Write                                       |
| --------------- | ----------- | ------------------------------- | ------------------------------------------ |
| `profiles`      | ✗           | own + admin                    | own + admin (admin can change role)        |
| `items`         | active only | own + admin                    | own insert/update/delete + admin           |
| `claims`        | ✗           | claimant + item owner + admin  | insert own; update: owner + admin          |
| `notifications` | ✗           | own                            | own + admin insert                         |
| `reports`       | ✗           | reporter + admin               | insert own; update: admin only             |
| `categories`   | ✓           | ✓                              | admin only                                 |
| `announcements` | ✓           | ✓                              | admin only                                 |

> A student who somehow calls an admin-only Supabase API will get an empty result or a Postgres error — **not** the restricted data. The UI hides the admin button for non-admins, but the database is the real source of truth.

---

## 5. Configure Supabase Auth

1. In Supabase Dashboard → **Authentication** → **Providers** → **Email**:
   - Make sure **Email** is enabled.
   - Decide whether to require email confirmation. If you turn it ON (recommended for production), new users must click a link in their inbox before they can sign in.
   - For local development, you can disable email confirmation to make testing faster.
2. (Optional) **Authentication → URL Configuration**:
   - **Site URL**: `http://localhost:3000` for local, your Vercel URL for prod.
   - **Redirect URLs**: add `http://localhost:3000` and `https://your-app.vercel.app`.

---

## 6. Create the first admin account

The `handle_new_user()` trigger in `schema.sql` automatically creates a `profiles` row with `role = 'student'` whenever anyone signs up. There is no UI for promoting to admin (by design — that would let any user self-promote).

To create the first admin:

1. **Sign up** in the running app at <http://localhost:3000/signup> using your SUO email (e.g. `shahzad.anjum@suokara.edu.pk`).
2. Open Supabase Dashboard → **SQL Editor** → New query.
3. Run:

```sql
update public.profiles
set role = 'admin'
where email = 'shahzad.anjum@suokara.edu.pk';
```

4. Sign out and sign back in. The navbar will now show **Admin** instead of **Dashboard**.

To promote other admins later, repeat step 3 with their email. To demote, set `role = 'student'` or `'staff'`.

---

## 7. Run the project locally

```bash
bun install        # or: npm install
bun run dev        # or: npm run dev
```

Open <http://localhost:3000>.

- If env vars are set correctly, the **SetupBanner** disappears and the app uses live Supabase data.
- If env vars are missing, the banner stays visible and the UI runs in a degraded state (no live data).

---

## 8. Deploy to Vercel

1. Push the project to a GitHub repo.
2. In Vercel, **Import Project** and pick the repo.
3. Vercel auto-detects Next.js. No build settings need to change.
4. Open **Project Settings → Environment Variables** and add the same three variables from `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. In Supabase Dashboard → **Authentication → URL Configuration**, add your Vercel production URL (e.g. `https://suloft.vercel.app`) to **Site URL** and **Redirect URLs**.
6. Redeploy.

---

## 9. Security checklist (production)

Before going live, verify:

- [ ] Email confirmation is **enabled** in Supabase Auth settings.
- [ ] The `service_role` key is **only** set on the server (Vercel env vars + `src/lib/supabase/server.ts`). It is **never** prefixed with `NEXT_PUBLIC_`.
- [ ] The `anon` key is the only one shipped to the browser.
- [ ] You have run `supabase/schema.sql` and `supabase/storage.sql`.
- [ ] You have promoted at least one user to `admin` via SQL.
- [ ] You have reviewed every RLS policy in `supabase/schema.sql` and confirmed it matches your access rules.
- [ ] Storage bucket `item-images` is set to **public read** (for thumbnails to render to anonymous visitors) and **authenticated write** scoped to `auth.uid()` (so users can only upload into their own folder).
- [ ] Your `.env.local` is in `.gitignore` (it already is in this project).

---

## 10. Project structure (Supabase integration)

```text
supabase/
  schema.sql          # Tables, enums, triggers, RLS policies
  storage.sql         # Storage bucket + storage RLS
  seed.sql            # Categories + demo announcements
src/lib/
  supabase/
    client.ts         # Browser client (anon key, safe to expose)
    server.ts         # Server-only client (service role key, NEVER in browser)
  auth-context.tsx    # Real Supabase Auth provider (signIn, signUp, signOut, reset, update)
  api.ts              # All DB queries (items, claims, notifications, etc.)
  image-utils.ts      # Image compression before upload
  types.ts            # TypeScript types matching the DB schema exactly
  store.ts            # UI state only (navigation)
  categories.ts       # Static fallback category list (mirrors seed.sql)
  use-categories.ts   # Hook that fetches categories from Supabase
.env.local.example    # Template for env vars
SETUP.md              # This file
```

---

## 11. Troubleshooting

**The SetupBanner won't go away.**
→ Double-check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in `.env.local`, then restart the dev server. The URL must start with `https://` and must not contain `YOUR-PROJECT-REF`.

**Sign-up says "Check your inbox" but I'm testing locally.**
→ Email confirmation is ON. Either (a) click the link in the inbox, or (b) turn off email confirmation in Supabase Dashboard → Authentication → Providers → Email.

**The Admin button doesn't appear after I sign in.**
→ Your `profiles.role` is still `student`. Run the SQL in section 6 to promote yourself to `admin`, then sign out and sign back in.

**`Permission denied` errors when uploading an image.**
→ Check that the storage path starts with your user id (e.g. `user-uuid/...`). The `item_images_insert_own` policy requires `(storage.foldername(name))[1] = auth.uid()::text`.

**Items don't show up in Browse even though I just posted one.**
→ The item's `status` is `active` (visible publicly), but RLS only allows public read for `active` items. If you set it to `removed` it disappears. Re-check the policy in `schema.sql`.

**I see `undefined` instead of the poster's name on item cards.**
→ Make sure you ran `schema.sql` and the `profiles` table exists. The `fetchItems` query joins `profiles!items_user_id_fkey` — if the foreign key is missing, the join returns null.

---

## 12. What changed from the mock version

| Area                | Before (mock)                          | After (Supabase)                              |
| ------------------- | -------------------------------------- | --------------------------------------------- |
| Auth                | `useSuloft().signIn(email)` mock fn     | `supabase.auth.signInWithPassword()` + `useAuth()` |
| Items               | Hardcoded array in `mock-data.ts`      | `fetchItems()` → `supabase.from('items').select()` |
| Claims              | Hardcoded array                       | `createClaim()` → `supabase.from('claims').insert()` |
| Notifications       | Hardcoded array                       | `fetchNotifications()` → `supabase.from('notifications').select()` |
| Admin actions       | `toast.success()` only                | `updateItemStatus()`, `updateClaimStatus()`, etc. → real DB writes |
| Images              | `URL.createObjectURL()` local preview | Compressed → `supabase.storage.from('item-images').upload()` → public URL stored in DB |
| Security            | UI hides admin button                  | UI hides admin button **+** RLS policies enforce at DB level **+** role check in `auth-context.tsx` |

The entire existing UI was preserved. Only the data layer and auth layer were rewritten to use real Supabase APIs.

---

**Need help?** Open the in-app **Contact** page (top navbar → Contact) to see the help center, FAQ, and contact form. For deeper debugging, the Supabase Dashboard → Logs → Postgres / Auth / Storage tabs show every request and any RLS denials.
