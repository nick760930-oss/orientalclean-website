import { startOfDay } from "date-fns";

// All times are handled in the server's local timezone. Deploy with
// TZ=Asia/Taipei (or your shop's timezone) set in the environment so server
// time matches the shop's wall-clock time.

export function dateAtMinutes(day: Date, minutesFromMidnight: number): Date {
  const base = startOfDay(day);
  return new Date(base.getTime() + minutesFromMidnight * 60_000);
}

export function ceilToStep(date: Date, stepMin: number): Date {
  const day = startOfDay(date);
  const minutesFromMidnight = (date.getTime() - day.getTime()) / 60_000;
  const rounded = Math.ceil(minutesFromMidnight / stepMin) * stepMin;
  return new Date(day.getTime() + rounded * 60_000);
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

// "YYYY-MM-DD" -> local midnight Date
export function parseDateOnly(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function formatDateOnly(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

// The shop is a single physical location in Taiwan, so times are always
// displayed in Taiwan local time regardless of the visitor's own device
// timezone — safe to call from client components (no Node-only APIs).
export const SHOP_TIMEZONE = "Asia/Taipei";

export function formatTimeInShopZone(iso: string): string {
  return new Date(iso).toLocaleTimeString("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: SHOP_TIMEZONE,
  });
}

export function minutesToHHMM(minutes: number): string {
  const h = String(Math.floor(minutes / 60)).padStart(2, "0");
  const m = String(minutes % 60).padStart(2, "0");
  return `${h}:${m}`;
}

export function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function formatDateInShopZone(iso: string): string {
  return new Date(iso).toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    timeZone: SHOP_TIMEZONE,
  });
}
