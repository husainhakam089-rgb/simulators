const AR = "ar-IQ";

export function formatMoney(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  if (!isFinite(n)) return "٠";
  if (Math.abs(n) >= 1_000_000) {
    return `${(n / 1_000_000).toLocaleString(AR, { maximumFractionDigits: 1 })} مليون`;
  }
  return n.toLocaleString(AR, { maximumFractionDigits: 0 });
}

export function formatMoneyFull(value: number | string | null | undefined): string {
  return Number(value ?? 0).toLocaleString(AR, { maximumFractionDigits: 0 });
}

export function formatNumber(value: number | string | null | undefined): string {
  return Number(value ?? 0).toLocaleString(AR, { maximumFractionDigits: 2 });
}

export function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d + (d.length === 10 ? "T00:00:00" : "")) : d;
  return new Intl.DateTimeFormat(AR, {
    day: "2-digit", month: "2-digit", year: "numeric", calendar: "gregory",
  }).format(date);
}

export function formatDateTime(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat(AR, {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
    calendar: "gregory", hour12: true,
  }).format(date);
}

/** "باقي X يوم" بصياغة عربية سليمة وبأرقام عربية */
export function daysLeftLabel(days: number): string {
  const ar = (n: number) => n.toLocaleString(AR);
  if (days < 0) {
    const n = Math.abs(days);
    if (n === 1) return "منتهية منذ يوم";
    if (n === 2) return "منتهية منذ يومين";
    if (n <= 10) return `منتهية منذ ${ar(n)} أيام`;
    return `منتهية منذ ${ar(n)} يوماً`;
  }
  if (days === 0) return "تنتهي اليوم";
  if (days === 1) return "باقي يوم واحد";
  if (days === 2) return "باقي يومان";
  if (days <= 10) return `باقي ${ar(days)} أيام`;
  return `باقي ${ar(days)} يوماً`;
}

export type RiskLevel = "expired" | "critical" | "warn" | "ok";

export function riskLevel(days: number, alertBefore = 30): RiskLevel {
  if (days < 0) return "expired";
  if (days <= Math.max(3, Math.round(alertBefore * 0.25))) return "critical";
  if (days <= alertBefore) return "warn";
  return "ok";
}

export function toISODate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

export function addMonths(base: Date, months: number): Date {
  const d = new Date(base);
  d.setMonth(d.getMonth() + months);
  return d;
}

/**
 * جمع عربي سليم: العربية لها مفرد ومثنى وجمع قلة (٣–١٠) وجمع كثرة (١١+).
 * arPlural(3, ["وجبة واحدة", "وجبتان", "وجبات", "وجبة"]) ← "٣ وجبات"
 */
export function arPlural(n: number, [one, two, few, many]: [string, string, string, string]): string {
  const num = n.toLocaleString(AR);
  if (n === 1) return one;
  if (n === 2) return two;
  if (n >= 3 && n <= 10) return `${num} ${few}`;
  return `${num} ${many}`;
}

export const WORDS = {
  batch:    ["وجبة واحدة", "وجبتان", "وجبات", "وجبة"] as [string, string, string, string],
  item:     ["صنف واحد", "صنفان", "أصناف", "صنفاً"] as [string, string, string, string],
  category: ["مجموعة واحدة", "مجموعتان", "مجموعات", "مجموعة"] as [string, string, string, string],
  carton:   ["كارتون واحد", "كارتونان", "كراتين", "كارتوناً"] as [string, string, string, string],
  row:      ["صف واحد", "صفان", "صفوف", "صفاً"] as [string, string, string, string],
  change:   ["تعديل واحد", "تعديلان", "تعديلات", "تعديلاً"] as [string, string, string, string],
  day:      ["يوم واحد", "يومان", "أيام", "يوماً"] as [string, string, string, string],
};
