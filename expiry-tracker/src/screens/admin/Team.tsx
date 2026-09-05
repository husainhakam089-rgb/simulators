import { useCallback, useEffect, useState } from "react";
import { supabase, callFunction } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { arPlural } from "../../lib/format";

interface Member { id: string; name: string; phone: string | null; role: "admin" | "worker" }

const ADMINS: [string, string, string, string] =
  ["مدير واحد", "مديران", "مديرين", "مديراً"];
const WORKERS: [string, string, string, string] =
  ["عامل واحد", "عاملان", "عمال", "عاملاً"];

export default function Team() {
  const { profile } = useAuth();
  const [rows, setRows] = useState<Member[]>([]);
  const [form, setForm] = useState({ name: "", phone: "", pin: "", role: "worker" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from("users").select("id, name, phone, role").order("name");
    setRows((data ?? []) as Member[]);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null); setMsg(null);
    try {
      await callFunction("admin-create-worker", form);
      setMsg(`أُضيف ${form.name}. رقمه هو اسم دخوله.`);
      setForm({ name: "", phone: "", pin: "", role: "worker" });
      await load();
    } catch (e) { setErr(String((e as Error).message)); }
    finally { setBusy(false); }
  }

  async function setRole(m: Member) {
    const next = m.role === "admin" ? "worker" : "admin";
    const label = next === "admin" ? "مديراً" : "عاملاً";
    if (!window.confirm(`اجعل ${m.name} ${label}؟`)) return;
    setErr(null); setMsg(null);
    try {
      await callFunction("admin-create-worker", { action: "set_role", user_id: m.id, role: next });
      setMsg(`${m.name} صار ${label}.`);
      await load();
    } catch (e) { setErr(String((e as Error).message)); }
  }

  async function resetPin(m: Member) {
    const pin = window.prompt(`رمز جديد لـ ${m.name} (٦ أرقام على الأقل)`);
    if (!pin) return;
    try {
      await callFunction("admin-create-worker", { action: "reset_pin", user_id: m.id, pin });
      setMsg("تم تغيير الرمز.");
    } catch (e) { setErr(String((e as Error).message)); }
  }

  async function remove(m: Member) {
    if (!window.confirm(`حذف ${m.name}؟`)) return;
    try {
      await callFunction("admin-create-worker", { action: "delete", user_id: m.id });
      await load();
    } catch (e) { setErr(String((e as Error).message)); }
  }

  return (
    <>
      <div className="card">
        <h2>إضافة عامل أو مدير</h2>
        <p className="hint">
          العامل يدخل برقم هاتفه ورمزه ولا يرى إلا الكاميرا. المدير يرى اللوحة كاملة
          ويصله الإشعار الصباحي — وتقدر تخلي أكثر من مدير.
        </p>
        {msg && <div className="success">{msg}</div>}
        {err && <div className="error">{err}</div>}
        <form onSubmit={add}>
          <label className="field">
            <span>الاسم</span>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label className="field">
            <span>رقم الهاتف</span>
            <input type="tel" inputMode="numeric" dir="ltr" placeholder="07XXXXXXXXX"
                   value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          </label>
          <label className="field">
            <span>رمز الدخول (٦ أرقام على الأقل)</span>
            <input type="text" inputMode="numeric" dir="ltr" minLength={6}
                   value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value })} required />
          </label>
          <label className="field">
            <span>الدور</span>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="worker">عامل — كاميرا فقط</option>
              <option value="admin">مدير — لوحة كاملة</option>
            </select>
          </label>
          <button className="btn" disabled={busy}>{busy ? "جارٍ الإضافة…" : "إضافة"}</button>
        </form>
      </div>

      <div className="card">
        <h2>الطاقم</h2>
        <p className="hint">
          {arPlural(rows.filter((m) => m.role === "admin").length, ADMINS)} و
          {arPlural(rows.filter((m) => m.role === "worker").length, WORKERS)}.
          الإشعار الصباحي يصل كل مدير سجّل جهازه.
        </p>
      </div>

      {rows.map((m) => (
        <div className="card member" key={m.id}>
          <div className="member-head">
            <div>
              <div className="member-name">{m.name}</div>
              <div className="member-phone" dir="ltr">{m.phone}</div>
            </div>
            <span className={`badge ${m.role === "admin" ? "ok" : "gray"}`}>
              {m.role === "admin" ? "مدير" : "عامل"}
            </span>
          </div>
          <div className="member-actions">
            <button className="btn small secondary" onClick={() => void setRole(m)}>
              {m.role === "admin" ? "اجعله عاملاً" : "اجعله مديراً"}
            </button>
            <button className="btn small secondary" onClick={() => void resetPin(m)}>رمز جديد</button>
            {m.id !== profile?.id && (
              <button className="btn small danger" onClick={() => void remove(m)}>حذف</button>
            )}
          </div>
        </div>
      ))}
    </>
  );
}
