// قراءة الملصق بخدمة سحابية عبر دالة `read-label`.
//
// السبب: محرك الجهاز يعجز عن الطباعة النقطية التي يُطبع بها تاريخ الصلاحية
// على الكراتين — قيسناه فأعطى ثلث التواريخ، وبعض ما أعطاه كان خاطئاً بشكل
// معقول (٠٨ بدل ٠٩)، وهذا أسوأ من لا تاريخ. الخدمة السحابية تقرأها.
//
// يبقى محرك الجهاز موجوداً ويعمل: بلا إنترنت، أو إن لم يُضبط المفتاح، أو إن
// تعطّلت الخدمة. لا شاشة تتوقف بسبب هذا الملف.

import { callFunction } from "./supabase";

/**
 * عرض الإرسال. التاريخ مطبوع صغيراً فالتصغير يقتله، والحجم الكبير يبطئ الرفع
 * على بيانات الموبايل. ١٦٠٠ بكسل ≈ ٣٠٠ كيلوبايت وهو ما نجح قياساً.
 */
const SEND_WIDTH = 1600;
const SEND_QUALITY = 0.85;

type Availability = "unknown" | "on" | "off";
let availability: Availability = "unknown";

/** «مطفأة» تعني: لا مفتاح مضبوط. لا نعيد المحاولة كل صورة بلا فائدة. */
export function cloudAvailability(): Availability {
  return availability;
}

export function resetCloudAvailability() {
  availability = "unknown";
}

export async function blobToJpegBase64(
  blob: Blob,
  maxWidth = SEND_WIDTH,
  quality = SEND_QUALITY,
): Promise<string | null> {
  const bitmap = await createImageBitmap(blob).catch(() => null);
  if (!bitmap) return null;
  const scale = Math.min(1, maxWidth / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  // ألوان لا رمادي: الخدمة تقرأ الألوان أفضل، والتجهيز الذي يفيد محرك الجهاز
  // (بنترة، لحم نقاط) يضرّها لأنها ترى الصورة كما هي أدق منّا.
  return canvas.toDataURL("image/jpeg", quality);
}

export interface CloudRead {
  ok: boolean;
  text: string;
  reason: string | null;
}

const OFFLINE: CloudRead = { ok: false, text: "", reason: "offline" };

/** يقرأ نص الصورة سحابياً. لا يرمي استثناءً أبداً. */
export async function readTextInCloud(blob: Blob): Promise<CloudRead> {
  if (availability === "off") return { ok: false, text: "", reason: "not_configured" };
  if (!navigator.onLine) return OFFLINE;

  const image = await blobToJpegBase64(blob);
  if (!image) return { ok: false, text: "", reason: "encode_failed" };

  try {
    const res = await callFunction<{ ok?: boolean; text?: string; reason?: string }>(
      "read-label",
      { image },
    );
    if (res?.ok && typeof res.text === "string") {
      availability = "on";
      return { ok: true, text: res.text, reason: null };
    }
    // «غير مضبوط» حالة دائمة حتى إعادة تحميل الصفحة؛ عطل المزوّد مؤقت
    if (res?.reason === "not_configured") availability = "off";
    return { ok: false, text: "", reason: res?.reason ?? "unknown" };
  } catch (e) {
    return { ok: false, text: "", reason: String(e) };
  }
}

/**
 * فحص بلا كلفة: هل مفتاح الخدمة مضبوط على الخادم؟
 * يراه المدير في شاشة الفريق ليعرف أن القراءة الدقيقة شغّالة فعلاً.
 */
export async function cloudConfigured(): Promise<boolean | null> {
  if (!navigator.onLine) return null;
  try {
    const res = await callFunction<{ configured?: boolean }>("read-label", { ping: true });
    return !!res?.configured;
  } catch {
    return null;
  }
}
