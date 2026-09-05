// الأدمن يضيف عاملاً — بدون أي بريد إلكتروني، رقم هاتف ورمز فقط.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, json, phoneToEmail, normalizePhone } from "./cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const url = Deno.env.get("SUPABASE_URL")!;

    const caller = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const { data: me } = await caller.auth.getUser();
    if (!me?.user) return json({ error: "غير مصرّح" }, 401);

    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false },
    });

    const { data: profile } = await admin
      .from("users").select("store_id, role").eq("id", me.user.id).single();
    if (!profile || profile.role !== "admin") return json({ error: "للأدمن فقط" }, 403);

    const body = await req.json();
    const action = body.action ?? "create";

    if (action === "delete") {
      const { data: target } = await admin
        .from("users").select("id, store_id").eq("id", body.user_id).single();
      if (!target || target.store_id !== profile.store_id) return json({ error: "غير موجود" }, 404);
      if (target.id === me.user.id) return json({ error: "لا يمكنك حذف نفسك" }, 400);
      await admin.auth.admin.deleteUser(target.id);
      return json({ ok: true });
    }

    // ترقية عامل إلى مدير أو العكس — بلا حذف الحساب، فيبقى سجل ما صوّره باسمه
    if (action === "set_role") {
      const role = body.role === "admin" ? "admin" : "worker";
      const { data: target } = await admin
        .from("users").select("id, store_id, role, name").eq("id", body.user_id).single();
      if (!target || target.store_id !== profile.store_id) return json({ error: "غير موجود" }, 404);

      // لا نترك المحل بلا مدير: آخر مدير لا يُنزَّل إلى عامل
      if (target.role === "admin" && role === "worker") {
        const { count } = await admin
          .from("users").select("id", { count: "exact", head: true })
          .eq("store_id", profile.store_id).eq("role", "admin").eq("is_active", true);
        if ((count ?? 0) <= 1) {
          return json({ error: "لا يمكن إنزال آخر مدير — عيّن مديراً آخر أولاً" }, 400);
        }
      }

      const { error } = await admin.from("users").update({ role }).eq("id", target.id);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true, role });
    }

    if (action === "reset_pin") {
      const { data: target } = await admin
        .from("users").select("id, store_id").eq("id", body.user_id).single();
      if (!target || target.store_id !== profile.store_id) return json({ error: "غير موجود" }, 404);
      if (!body.pin || String(body.pin).length < 6) return json({ error: "الرمز ٦ أرقام على الأقل" }, 400);
      const { error } = await admin.auth.admin.updateUserById(target.id, { password: String(body.pin) });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    const cleanPhone = normalizePhone(body.phone);
    if (!body.name?.trim()) return json({ error: "الاسم مطلوب" }, 400);
    if (cleanPhone.length < 8) return json({ error: "رقم الهاتف غير صحيح" }, 400);
    if (!body.pin || String(body.pin).length < 6) return json({ error: "الرمز ٦ أرقام على الأقل" }, 400);

    const { data: created, error: authErr } = await admin.auth.admin.createUser({
      email: phoneToEmail(cleanPhone),
      password: String(body.pin),
      email_confirm: true,
      user_metadata: { name: body.name, phone: cleanPhone },
    });
    if (authErr || !created?.user) {
      const msg = String(authErr?.message ?? "");
      if (msg.includes("already")) return json({ error: "هذا الرقم مسجّل مسبقاً" }, 409);
      return json({ error: msg || "تعذّر إنشاء الحساب" }, 400);
    }

    const { error: insErr } = await admin.from("users").insert({
      id: created.user.id,
      store_id: profile.store_id,
      name: body.name.trim(),
      phone: cleanPhone,
      role: body.role === "admin" ? "admin" : "worker",
    });
    if (insErr) {
      await admin.auth.admin.deleteUser(created.user.id);
      return json({ error: insErr.message }, 400);
    }

    return json({ ok: true, user_id: created.user.id });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
