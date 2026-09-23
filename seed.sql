-- SULOFT — Seed Data
-- =============================================================================
-- Seeds the categories table with the 9 default Lost & Found categories.
-- Run this AFTER schema.sql and storage.sql.
--
-- NOTE: This file does NOT create any user accounts, items, or announcements.
-- To create the first admin account, see SETUP.md → "Creating the first admin".
-- Announcements should be created through the Admin Dashboard, not seeded.
--
-- Idempotent: categories use ON CONFLICT (id) DO NOTHING (fixed UUIDs).
-- =============================================================================

-- 1. Categories (fixed UUIDs — safe to re-run, ON CONFLICT (id) DO NOTHING)
insert into public.categories (id, name, icon, description)
values
  ('00000000-0000-0000-0000-000000000001', 'Electronics',      'Smartphone', 'Phones, laptops, tablets, chargers, headphones'),
  ('00000000-0000-0000-0000-000000000002', 'Books & Notes',    'BookOpen',   'Textbooks, notebooks, lab manuals'),
  ('00000000-0000-0000-0000-000000000003', 'Wallets & Cards',  'CreditCard', 'Wallets, ID cards, bank cards, CNIC'),
  ('00000000-0000-0000-0000-000000000004', 'Keys',             'KeyRound',   'Room keys, bike locks, keychains'),
  ('00000000-0000-0000-0000-000000000005', 'Clothing',         'Shirt',      'Jackets, hoodies, scarves, caps'),
  ('00000000-0000-0000-0000-000000000006', 'Bags',             'Backpack',   'Backpacks, handbags, laptop bags'),
  ('00000000-0000-0000-0000-000000000007', 'Accessories',      'Glasses',    'Watches, sunglasses, jewelry, umbrellas'),
  ('00000000-0000-0000-0000-000000000008', 'Documents',        'FileText',   'Notes, assignments, certificates, admit cards'),
  ('00000000-0000-0000-0000-000000000009', 'Other',            'Package',    'Anything that doesn''t fit elsewhere')
on conflict (id) do nothing;

-- =============================================================================
-- End of seed.
-- =============================================================================
