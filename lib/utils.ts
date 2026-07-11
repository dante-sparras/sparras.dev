import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Expand/normalize CSS hex: `#rgb` / `#rgba` / `#rrggbb` / `#rrggbbaa`. */
export function normalizeHex(value: string): string | undefined {
  let s = String(value).trim().toLowerCase();
  if (!s.startsWith("#")) s = `#${s}`;
  const h = s.slice(1);

  if (/^[0-9a-f]{3}$/.test(h)) {
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`;
  }
  if (/^[0-9a-f]{4}$/.test(h)) {
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`;
  }
  if (/^[0-9a-f]{6}$/.test(h) || /^[0-9a-f]{8}$/.test(h)) {
    return `#${h}`;
  }
  return undefined;
}

/** Opaque `#rrggbb` only (drops alpha channel if present). */
export function normalizeHexOpaque(value: string): string | undefined {
  const full = normalizeHex(value);
  if (full && full.length >= 7) return full.slice(0, 7);
  return undefined;
}

export type Rgba = { r: number; g: number; b: number; a: number };

/** Parse hex to sRGB 0–1 + alpha (no color-management linearization). */
export function parseHexRgba(hex: string, fallback = "#000000ff"): Rgba {
  const normalized = normalizeHex(hex) ?? normalizeHex(fallback) ?? "#000000ff";
  const n =
    normalized.length === 7 ? `${normalized.slice(1)}ff` : normalized.slice(1);
  return {
    r: parseInt(n.slice(0, 2), 16) / 255,
    g: parseInt(n.slice(2, 4), 16) / 255,
    b: parseInt(n.slice(4, 6), 16) / 255,
    a: parseInt(n.slice(6, 8), 16) / 255,
  };
}
