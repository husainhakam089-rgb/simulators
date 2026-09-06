// وكيل القراءة المدفوع: Claude يشوف صورة الكارتون ويرجّع الحقول مفصولة.
//
// نفس تعليمات الوكيل المجاني حرفياً (LABEL_SYSTEM) حتى تكون النتيجة واحدة
// أياً كان المزوّد، ولا يتغيّر سلوك التطبيق حين نبدّل بينهما.
//
// القاعدة الحاكمة: لا يخمّن رقماً لا يراه. تاريخ خاطئ معقول يعني بضاعة سليمة
// تُتلف أو خربانة تُباع، وهو أسوأ من لا تاريخ.
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.124.0";
import { LABEL_SYSTEM, type LabelFields } from "./gemini.ts";

export type { LabelFields };

export async function readLabelWithAgent(
  apiKey: string,
  imageBase64: string,
  mediaType: string,
  model: string,
): Promise<LabelFields | null> {
  const client = new Anthropic({ apiKey });

  const res = await client.beta.messages.create({
    model,
    max_tokens: 8000,
    // إن رفض النموذج الطلب لسبب أمني، يتولّى الخادم التحويل لنموذج بديل بدل
    // أن يقف العامل أمام كارتون بلا جواب
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: `${LABEL_SYSTEM}\n\nاستدعِ الأداة read_label دائماً بنتيجتك.`,
    messages: [{
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
        { type: "text", text: "اقرأ هذا الكارتون واستخرج الحقول." },
      ],
    }],
    tools: [{
      name: "read_label",
      description: "يسجّل ما قُرئ من الكارتون",
      strict: true,
      input_schema: {
        type: "object",
        properties: {
          verbatim_text: { type: "string", description: "كل النص كما هو، سطراً سطراً" },
          product_name: { type: ["string", "null"], description: "الاسم التجاري كما هو مكتوب" },
          expiry_raw: { type: ["string", "null"], description: "تاريخ الانتهاء كما طُبع حرفياً" },
          expiry_date: { type: ["string", "null"], description: "تاريخ الانتهاء YYYY-MM-DD" },
          production_date: { type: ["string", "null"], description: "تاريخ الإنتاج YYYY-MM-DD" },
          sure: { type: "boolean", description: "true فقط إن كان كل محرف في التاريخ واضحاً" },
          note: { type: ["string", "null"], description: "سبب قصير بالعربية" },
        },
        required: [
          "verbatim_text", "product_name", "expiry_raw",
          "expiry_date", "production_date", "sure", "note",
        ],
        additionalProperties: false,
      },
    }],
  } as never) as { stop_reason?: string; content?: { type: string; name?: string; input?: unknown }[] };

  // الرفض الأمني يأتي بحالة ٢٠٠ لا خطأ — نتحقق قبل قراءة المحتوى
  if (res?.stop_reason === "refusal") return null;

  const call = res?.content?.find((b) => b.type === "tool_use" && b.name === "read_label");
  return (call?.input as LabelFields) ?? null;
}
