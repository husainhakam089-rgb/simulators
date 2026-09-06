// إرسال الإشعار اليومي المجمّع (إشعار واحد لكل محل، وخارج فترة الصمت).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, json } from "./cors.ts";
import { sendPush, type VapidKeys } from "./webpush.ts";

const QUIET_START = 21; // ٩ مساءً
const QUIET_END = 6;    // ٦ صباحاً

function localParts(tz: string) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hour12: false,
  });
  const p = Object.fromEntries(fmt.formatToParts(new Date()).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = Deno.env.get("SUPABASE_URL")!;
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

  try {
    const body = await req.json().catch(() => ({}));
    const isTest = body?.mode === "test";
    let testStoreId: string | null = null;
    let testUserId: string | null = null;

    if (isTest) {
      const caller = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
        auth: { persistSession: false },
      });
      const { data: me } = await caller.auth.getUser();
      if (!me?.user) return json({ error: "غير مصرّح" }, 401);
      const { data: profile } = await admin
        .from("users").select("store_id, role").eq("id", me.user.id).single();
      if (!profile || profile.role !== "admin") return json({ error: "للأدمن فقط" }, 403);
      testStoreId = profile.store_id;
      testUserId = me.user.id;
    } else {
      const secret = req.headers.get("x-cron-secret") ?? "";
      const { data: okSecret } = await admin.rpc("check_cron_secret", { p_secret: secret });
      if (okSecret !== true) return json({ error: "forbidden" }, 401);
    }

    const { data: vapidRow, error: vapidErr } = await admin.rpc("get_vapid");
    if (vapidErr || !vapidRow) return json({ error: "vapid_missing" }, 500);
    const keys: VapidKeys = {
      publicKey: vapidRow.public,
      privateKey: vapidRow.private,
      subject: vapidRow.subject,
    };

    // ------------------------------------------------------ إشعار تجريبي
    if (isTest) {
      const { data: subs } = await admin
        .from("push_subscriptions").select("*").eq("user_id", testUserId!);
      const payload = JSON.stringify({
        title: "تجربة إشعار",
        body: "الإشعارات تعمل. سيصلك ملخص واحد كل صباح.",
        url: "/admin",
      });
      let sent = 0;
      for (const s of subs ?? []) {
        const r = await sendPush({ endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth_key }, payload, keys);
        if (r.ok) sent++;
        else if (r.status === 404 || r.status === 410) {
          await admin.from("push_subscriptions").delete().eq("id", s.id);
        }
      }
      return json({ ok: true, sent, subscriptions: subs?.length ?? 0, store_id: testStoreId });
    }

    // -------------------------------------------- الإشعار اليومي المجمّع
    const { data: stores } = await admin.from("stores").select("id, timezone");
    const results: unknown[] = [];

    for (const store of stores ?? []) {
      const tz = store.timezone || "Asia/Baghdad";
      const { date, hour } = localParts(tz);

      // لا تنبيه بين ٩ مساءً و٦ صباحاً
      if (hour >= QUIET_START || hour < QUIET_END) {
        results.push({ store: store.id, skipped: "quiet_hours" });
        continue;
      }

      const { data: digest } = await admin
        .from("daily_digests").select("*")
        .eq("store_id", store.id).eq("digest_date", date)
        .is("pushed_at", null).maybeSingle();

      if (!digest) { results.push({ store: store.id, skipped: "no_digest" }); continue; }

      const { data: admins } = await admin
        .from("users").select("id").eq("store_id", store.id).eq("role", "admin").eq("is_active", true);
      const adminIds = (admins ?? []).map((a) => a.id);
      if (adminIds.length === 0) { results.push({ store: store.id, skipped: "no_admins" }); continue; }

      const { data: subs } = await admin
        .from("push_subscriptions").select("*").in("user_id", adminIds);

      const payload = JSON.stringify({
        title: digest.title,
        body: digest.body,
        url: "/admin/alerts",
        tag: `digest-${date}`,
      });

      let sent = 0, failed = 0;
      for (const s of subs ?? []) {
        const r = await sendPush({ endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth_key }, payload, keys);
        if (r.ok) sent++;
        else {
          failed++;
          if (r.status === 404 || r.status === 410) {
            await admin.from("push_subscriptions").delete().eq("id", s.id);
          }
        }
      }

      await admin.from("daily_digests").update({
        pushed_at: new Date().toISOString(),
        push_result: `sent=${sent} failed=${failed} subs=${subs?.length ?? 0}`,
      }).eq("id", digest.id);

      results.push({ store: store.id, sent, failed, items: digest.item_count });
    }

    return json({ ok: true, results });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
