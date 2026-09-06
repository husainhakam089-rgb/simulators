// قراءة نص الملصق بخدمة سحابية.
//
// لماذا خادم وسيط بدل نداء مباشر من الموبايل: مفتاح الخدمة يبقى هنا. لو وُضع
// في التطبيق لقرأه أي أحد من الشيفرة وحمّل صاحب المحل فاتورة غيره.
//
// إن لم يُضبط المفتاح ترجع الدالة { ok: false, reason: "not_configured" }
// بحالة ٢٠٠ لا خطأ: التطبيق حينها يقرأ بمحرك الجهاز كما كان، بلا رسالة عطل.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, json } from "./cors.ts";

const VISION_URL = "https://vision.googleapis.com/v1/images:annotate";

// سقف الحجم: صورة كارتون بعرض ١٦٠٠ بكسل ≈ ٣٠٠ كيلوبايت، و base64 يزيدها الثلث.
// أربعة ميغا سقف سخيّ يمنع رفع فيديو بالغلط.
const MAX_BASE64 = 4 * 1024 * 1024;

/** يقبل dataURL أو base64 خاماً ويرجع base64 وحده */
function toBase64(image: unknown): string | null {
  if (typeof image !== "string" || !image) return null;
  const comma = image.indexOf(",");
  const raw = image.startsWith("data:") && comma > 0 ? image.slice(comma + 1) : image;
  return /^[A-Za-z0-9+/=\s]+$/.test(raw) ? raw.replace(/\s+/g, "") : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const key = Deno.env.get("GOOGLE_VISION_KEY");

    // القراءة تكلّف مالاً، فلا تُفتح إلا لمن دخل التطبيق فعلاً
    const caller = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
        auth: { persistSession: false },
      },
    );
    const { data: me } = await caller.auth.getUser();
    if (!me?.user) return json({ error: "غير مصرّح" }, 401);

    const body = await req.json().catch(() => ({}));

    // فحص بلا كلفة: يسأل المدير «هل القراءة السحابية شغّالة؟» فلا نستهلك صورة
    if (body.ping) return json({ ok: true, configured: !!key });

    if (!key) return json({ ok: false, reason: "not_configured" });

    const image = toBase64(body.image);
    if (!image) return json({ error: "صورة غير صالحة" }, 400);
    if (image.length > MAX_BASE64) return json({ error: "الصورة كبيرة جداً" }, 413);

    // DOCUMENT_TEXT_DETECTION أدق من TEXT_DETECTION مع الطباعة النقطية الصغيرة،
    // وتلميح اللغة يمنع قراءة العربي حروفاً لاتينية متشابهة الشكل.
    const res = await fetch(`${VISION_URL}?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [{
          image: { content: image },
          features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
          imageContext: { languageHints: ["ar", "en"] },
        }],
      }),
    });

    const out = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = out?.error?.message ?? `HTTP ${res.status}`;
      console.error("فشل نداء خدمة القراءة:", msg);
      // لا نُفشل العامل: يرجع التطبيق لمحرك الجهاز
      return json({ ok: false, reason: "provider_error", detail: String(msg) });
    }

    const r = out?.responses?.[0] ?? {};
    if (r.error?.message) return json({ ok: false, reason: "provider_error", detail: r.error.message });

    const text: string = r.fullTextAnnotation?.text ?? r.textAnnotations?.[0]?.description ?? "";
    return json({ ok: true, text, provider: "google-vision" });
  } catch (e) {
    console.error(e);
    return json({ ok: false, reason: "provider_error", detail: String(e) });
  }
});
