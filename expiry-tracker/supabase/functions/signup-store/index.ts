// إنشاء محل جديد + حساب الأدمن. الدخول برقم الهاتف ورمز من ٦ أرقام.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, json, phoneToEmail, normalizePhone } from "./cors.ts";

// مجموعات جاهزة بأعمار افتراضية — حتى لا يبدأ صاحب المحل من صفحة فارغة
const DEFAULT_CATEGORIES: [string, number | null, number, boolean][] = [
  ["ألبان وأجبان", 14, 3, true],
  ["لحوم طازجة", 5, 2, true],
  ["دجاج ولحوم مجمدة", 365, 30, true],
  ["خضار وفواكه", 7, 2, true],
  ["مخبوزات", 5, 2, true],
  ["بيض", 21, 5, true],
  ["مشروبات غازية", 270, 30, true],
  ["عصائر", 180, 21, true],
  ["معلبات", 730, 60, true],
  ["بقوليات وحبوب", 365, 45, true],
  ["أرز وسكر وطحين", 365, 45, true],
  ["زيوت ودهون", 540, 45, true],
  ["حلويات وشوكولاتة", 270, 30, true],
  ["رقائق وسناكس", 180, 21, true],
  ["شاي وقهوة", 730, 60, true],
  ["بهارات", 540, 45, true],
  ["أغذية أطفال", 365, 60, true],
  ["مجمدات", 365, 30, true],
  ["منظفات ومواد تنظيف", null, 30, false],
  ["مواد غير غذائية", null, 30, false],
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { store_name, admin_name, phone, pin } = await req.json();

    const cleanPhone = normalizePhone(phone);
    if (!store_name?.trim()) return json({ error: "اسم المحل مطلوب" }, 400);
    if (!admin_name?.trim()) return json({ error: "اسمك مطلوب" }, 400);
    if (cleanPhone.length < 8) return json({ error: "رقم الهاتف غير صحيح" }, 400);
    if (!pin || String(pin).length < 6) return json({ error: "الرمز يجب أن يكون ٦ أرقام على الأقل" }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const { data: created, error: authErr } = await admin.auth.admin.createUser({
      email: phoneToEmail(cleanPhone),
      password: String(pin),
      email_confirm: true,
      user_metadata: { name: admin_name, phone: cleanPhone },
    });
    if (authErr || !created?.user) {
      const msg = String(authErr?.message ?? "");
      if (msg.includes("already")) return json({ error: "هذا الرقم مسجّل مسبقاً" }, 409);
      return json({ error: msg || "تعذّر إنشاء الحساب" }, 400);
    }

    const userId = created.user.id;

    const { data: store, error: storeErr } = await admin
      .from("stores").insert({ name: store_name.trim() }).select("id").single();
    if (storeErr) {
      await admin.auth.admin.deleteUser(userId);
      return json({ error: storeErr.message }, 400);
    }

    const { error: userErr } = await admin.from("users").insert({
      id: userId, store_id: store.id, name: admin_name.trim(),
      phone: cleanPhone, role: "admin",
    });
    if (userErr) {
      await admin.from("stores").delete().eq("id", store.id);
      await admin.auth.admin.deleteUser(userId);
      return json({ error: userErr.message }, 400);
    }

    await admin.from("categories").insert(
      DEFAULT_CATEGORIES.map(([name, shelf, alert, perishable]) => ({
        store_id: store.id,
        name,
        default_shelf_life_days: shelf,
        alert_before_days: alert,
        is_perishable: perishable,
      })),
    );

    return json({ ok: true, store_id: store.id, email: phoneToEmail(cleanPhone) });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
