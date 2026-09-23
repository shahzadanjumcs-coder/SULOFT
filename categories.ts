// SULOFT — Static category fallback
// -----------------------------------------------------------------------------
// The authoritative category list lives in the `categories` table (seeded by
// supabase/seed.sql). For icon resolution in components that don't need a
// network round-trip on every render (e.g. <ItemImage>), we provide a static
// fallback that mirrors the seeded rows. Once categories are fetched from
// Supabase via `fetchCategories()`, components merge them in.
// -----------------------------------------------------------------------------

import type { Category } from "./types";

export const FALLBACK_CATEGORIES: Category[] = [
  { id: "00000000-0000-0000-0000-000000000001", name: "Electronics", icon: "Smartphone", description: "Phones, laptops, tablets, chargers, headphones" },
  { id: "00000000-0000-0000-0000-000000000002", name: "Books & Notes", icon: "BookOpen", description: "Textbooks, notebooks, lab manuals" },
  { id: "00000000-0000-0000-0000-000000000003", name: "Wallets & Cards", icon: "CreditCard", description: "Wallets, ID cards, bank cards, CNIC" },
  { id: "00000000-0000-0000-0000-000000000004", name: "Keys", icon: "KeyRound", description: "Room keys, bike locks, keychains" },
  { id: "00000000-0000-0000-0000-000000000005", name: "Clothing", icon: "Shirt", description: "Jackets, hoodies, scarves, caps" },
  { id: "00000000-0000-0000-0000-000000000006", name: "Bags", icon: "Backpack", description: "Backpacks, handbags, laptop bags" },
  { id: "00000000-0000-0000-0000-000000000007", name: "Accessories", icon: "Glasses", description: "Watches, sunglasses, jewelry, umbrellas" },
  { id: "00000000-0000-0000-0000-000000000008", name: "Documents", icon: "FileText", description: "Notes, assignments, certificates, admit cards" },
  { id: "00000000-0000-0000-0000-000000000009", name: "Other", icon: "Package", description: "Anything that doesn't fit elsewhere" },
];

export function findCategory(
  id: string | null | undefined,
  liveCategories?: Category[]
): Category | undefined {
  if (!id) return undefined;
  return (
    liveCategories?.find((c) => c.id === id) ||
    FALLBACK_CATEGORIES.find((c) => c.id === id)
  );
}
