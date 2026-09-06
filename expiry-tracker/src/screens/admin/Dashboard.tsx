import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { WORDS, arPlural, formatMoney, formatMoneyFull } from "../../lib/format";
import { useAuth } from "../../lib/auth";
import { currentPushState, enablePush, pushSupported, sendTestPush } from "../../lib/push";

interface Bucket { count: number; value: number }
interface Summary {
  expired: Bucket; d7: Bucket; d30: Bucket; d90: Bucket;
  unknown: number; low_conf: number; today: string;
}

const UNKNOWN_WORDS: [string, string, string, string] =
  ["صنف مجهول واحد", "صنفان مجهولان", "أصناف مجهولة", "صنفاً مجهولاً"];
const LOW_CONF_WORDS: [string, string, string, string] =
  ["تاريخ واحد منخفض الثقة", "تاريخان منخفضا الثقة", "تواريخ منخفضة الثقة", "تاريخاً منخفض الثقة"];

export default function Dashboard() {
  const { profile } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [digest, setDigest] = useState<{ title: string; body: string } | null>(null);
  const [pushState, setPushState] = useState<string>("default");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.rpc("dashboard_summary");
      setSummary(data as Summary);
      const { data: d } = await supabase
        .from("daily_digests").select("title, body")
        .order("digest_date", { ascending: false }).limit(1).maybeSingle();
      setDigest(d);
      setPushState(await currentPushState());
    })();
  }, []);

  async function turnOnPush() {
    setErr(null); setMsg(null);
    try {
      await enablePush(profile!.store_id, profile!.id);
      setPushState("granted");
      setMsg("تم تفعيل الإشعارات. يصلك ملخص واحد كل صباح.");
    } catch (e) { setErr(String((e as Error).message)); }
  }

  async function test() {
    setErr(null); setMsg(null);
    try {
      const r = await sendTestPush();
      setMsg(r.sent > 0 ? "أُرسل إشعار تجريبي." : "لا يوجد جهاز مشترك بعد.");
    } catch (e) { setErr(String((e as Error).message)); }
  }

  if (!summary) return <div className="empty">جارٍ التحميل…</div>;

  return (
    <>
      {digest && (
        <div className="card" style={{ borderInlineStart: "6px solid var(--brand)" }}>
          <h2>{digest.title}</h2>
          <p className="hint" style={{ marginBottom: 12 }}>{digest.body}</p>
          <Link to="/admin/alerts"><button className="btn small">افتح القائمة</button></Link>
        </div>
      )}

      <div className="grid four" style={{ marginBottom: 14 }}>
        <Stat cls="expired"  label="منتهية الآن"   value={summary.expired.value} count={summary.expired.count} />
        <Stat cls="critical" label="خلال ٧ أيام"   value={summary.d7.value}      count={summary.d7.count} />
        <Stat cls="warn"     label="خلال ٣٠ يوم"   value={summary.d30.value}     count={summary.d30.count} />
        <Stat cls="ok"       label="خلال ٩٠ يوم"   value={summary.d90.value}     count={summary.d90.count} />
      </div>

      {(summary.unknown > 0 || summary.low_conf > 0) && (
        <div className="card">
          <h2>يحتاج مراجعتك</h2>
          <p className="hint">
            {arPlural(summary.unknown, UNKNOWN_WORDS)}،
            و{arPlural(summary.low_conf, LOW_CONF_WORDS)}.
          </p>
          <Link to="/admin/review"><button className="btn small secondary">افتح المراجعة</button></Link>
        </div>
      )}

      <div className="card">
        <h2>الإشعار الصباحي</h2>
        <p className="hint">إشعار واحد كل صباح قبل فتح المحل، مرتب حسب المبلغ. لا إشعارات ليلاً.</p>
        {msg && <div className="success">{msg}</div>}
        {err && <div className="error">{err}</div>}
        {!pushSupported() && <p className="muted">متصفحك لا يدعم الإشعارات — افتح التطبيق من الشاشة الرئيسية.</p>}
        {pushSupported() && pushState !== "granted" && (
          <button className="btn small" onClick={() => void turnOnPush()}>فعّل الإشعارات</button>
        )}
        {pushSupported() && pushState === "granted" && (
          <div className="btn-row">
            <button className="btn small secondary" onClick={() => void turnOnPush()}>تسجيل هذا الجهاز</button>
            <button className="btn small ghost" onClick={() => void test()}>إشعار تجريبي</button>
          </div>
        )}
      </div>
    </>
  );
}

function Stat({ cls, label, value, count }: { cls: string; label: string; value: number; count: number }) {
  return (
    <div className={`stat ${cls}`}>
      <div className="label">{label}</div>
      <div className="value" title={`${formatMoneyFull(value)} دينار`}>{formatMoney(value)}</div>
      <div className="count">{arPlural(count, WORDS.batch)}</div>
    </div>
  );
}
