import { useState } from "react";
import { Link } from "react-router-dom";
import { callFunction } from "../lib/supabase";
import { useAuth } from "../lib/auth";

export default function Signup() {
  const { signIn } = useAuth();
  const [form, setForm] = useState({ store_name: "", admin_name: "", phone: "", pin: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await callFunction("signup-store", form);
      await signIn(form.phone, form.pin);
    } catch (err) {
      setError(String((err as Error).message));
      setBusy(false);
    }
  }

  return (
    <div className="center-screen">
      <form className="card auth-card" onSubmit={submit}>
        <h1>تسجيل محل جديد</h1>
        <p className="sub">دقيقة واحدة، ثم ترفع ملف الأصناف</p>

        {error && <div className="error">{error}</div>}

        <label className="field">
          <span>اسم المحل</span>
          <input type="text" value={form.store_name} onChange={set("store_name")} required />
        </label>
        <label className="field">
          <span>اسمك</span>
          <input type="text" value={form.admin_name} onChange={set("admin_name")} required />
        </label>
        <label className="field">
          <span>رقم هاتفك (اسم الدخول)</span>
          <input type="tel" inputMode="numeric" dir="ltr" placeholder="07XXXXXXXXX"
                 value={form.phone} onChange={set("phone")} required />
        </label>
        <label className="field">
          <span>رمز الدخول (٦ أرقام على الأقل)</span>
          <input type="password" inputMode="numeric" dir="ltr" minLength={6}
                 value={form.pin} onChange={set("pin")} required />
        </label>

        <button className="btn" disabled={busy}>{busy ? "جارٍ الإنشاء…" : "إنشاء المحل"}</button>

        <div className="center" style={{ marginTop: 16 }}>
          <Link className="link-btn" to="/login">عندي حساب</Link>
        </div>
      </form>
    </div>
  );
}
