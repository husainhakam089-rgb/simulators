// وكيل القراءة المجاني: Gemini من Google AI Studio.
//
// نفس عمل وكيل Claude — يشوف صورة الكارتون ويرجّع الاسم والتاريخ مفصولين —
// لكن ضمن الحصّة المجانية التي تمنحها Google. حدودها اليومية تضبطها Google
// وقد تتغيّر، فإن نفدت أو تعطّلت الخدمة نُكمل بالمزوّد التالي ثم بمحرك الجهاز،
// ولا يقف العامل أبداً.
//
// نستعمل REST مباشرة لا حزمة: نداء واحد، ولا داعي لجرّ مكتبة إلى الحافة.

export interface LabelFields {
  verbatim_text: string;
  product_name: string | null;
  expiry_raw: string | null;
  expiry_date: string | null;
  production_date: string | null;
  sure: boolean;
  note: string | null;
}

export const LABEL_SYSTEM = `أنت تقرأ صورة كارتون بضاعة في محل بغداد. مهمتك استخراج ما هو
مطبوع فعلاً على الكارتون، لا ما تتوقعه.

قواعد ملزمة:
- لا تخمّن أبداً محرفاً لا تراه بوضوح. تاريخ الصلاحية يُطبع بطابعة نقطية صغيرة،
  وقد تكون خانة غير واضحة. إن لم يكن كل محرف في التاريخ واضحاً، ضع sure=false.
- تاريخ خاطئ أسوأ من لا تاريخ: يعني بضاعة سليمة تُتلف أو خربانة تُباع.
- ميّز الإنتاج من الانتهاء بالكلمة المطبوعة (MFG/PROD/الإنتاج مقابل
  EXP/BEST BEFORE/الانتهاء). فإن لم توجد كلمة وكان هناك تاريخان، الأبعد هو الانتهاء.
- التاريخ العراقي يوم/شهر/سنة. وإن كان شهراً وسنة فقط فاليوم هو آخر يوم في الشهر.
- اسم المنتج هو الاسم التجاري الكبير على العلبة كما هو مكتوب، بلا ترجمة.
- verbatim_text: كل ما تقرأه من الصورة سطراً سطراً كما هو، بلا تصحيح.`;

const BASE = "https://generativelanguage.googleapis.com/v1beta/models";

// مخطّط الإجابة: Gemini يضمن الشكل حين نعطيه المخطّط، فلا نحلّل نصاً حرّاً
const SCHEMA = {
  type: "OBJECT",
  properties: {
    verbatim_text: { type: "STRING" },
    product_name: { type: "STRING", nullable: true },
    expiry_raw: { type: "STRING", nullable: true },
    expiry_date: { type: "STRING", nullable: true },
    production_date: { type: "STRING", nullable: true },
    sure: { type: "BOOLEAN" },
    note: { type: "STRING", nullable: true },
  },
  required: ["verbatim_text", "sure"],
};

export async function readLabelWithGemini(
  apiKey: string,
  imageBase64: string,
  mediaType: string,
  model: string,
): Promise<LabelFields | null> {
  const res = await fetch(
    `${BASE}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: LABEL_SYSTEM }] },
        contents: [{
          role: "user",
          parts: [
            { inline_data: { mime_type: mediaType, data: imageBase64 } },
            { text: "اقرأ هذا الكارتون واستخرج الحقول." },
          ],
        }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: SCHEMA,
          temperature: 0,
        },
      }),
    },
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    // ٤٢٩ = نفدت الحصّة المجانية اليوم، ٤٠٤ = اسم النموذج تغيّر
    console.error(`فشل نداء Gemini (${res.status}):`, detail.slice(0, 300));
    return null;
  }

  const out = await res.json().catch(() => null);
  const text: string | undefined = out?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return null;

  try {
    const fields = JSON.parse(text) as LabelFields;
    return typeof fields?.verbatim_text === "string" ? fields : null;
  } catch {
    console.error("ردّ Gemini ليس JSON صالحاً");
    return null;
  }
}
