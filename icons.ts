// SULOFT — Lucide icon resolver
// Allows categories and locations to reference icons by name without shipping
// every icon to every page. Only icons actually used in the app are exported.

import {
  Backpack,
  BookOpen,
  CreditCard,
  FileText,
  Glasses,
  KeyRound,
  Package,
  Shirt,
  Smartphone,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  Smartphone,
  BookOpen,
  CreditCard,
  KeyRound,
  Shirt,
  Backpack,
  Glasses,
  FileText,
  Package,
};

export function getIcon(name?: string): LucideIcon {
  if (name && ICONS[name]) return ICONS[name];
  return Package;
}

export const availableIconNames = Object.keys(ICONS);
