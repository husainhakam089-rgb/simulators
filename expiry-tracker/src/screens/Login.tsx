import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";

export default function Login() {
  const { signIn } = useAuth();
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signIn(phone, pin);
    } catch (err) {
      setError(String((err as Error).message));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="center-screen">
      <form className="card auth-card" onSubmit={submit}>
        <h1>تتبع الصلاحية</h1>
        <p className="sub">ادخل برقم هاتفك والرمز</p>

        {error && <div className="error">{error}</div>}

        <label className="field">
          <span>رقم الهاتف</span>
          <input
            type="tel" inputMode="numeric" autoComplete="username" dir="ltr"
            placeholder="07XXXXXXXXX"
            value={phone} onChange={(e) => setPhone(e.target.value)} required
          />
        </label>

        <label className="field">
          <span>الرمز</span>
          <input
            type="password" inputMode="numeric" autoComplete="current-password" dir="ltr"
            value={pin} onChange={(e) => setPin(e.target.value)} required
          />
        </label>

        <button className="btn" disabled={busy}>{busy ? "جارٍ الدخول…" : "دخول"}</button>

        <div className="center" style={{ marginTop: 16 }}>
          <Link className="link-btn" to="/signup">تسجيل محل جديد</Link>
        </div>
      </form>
    </div>
  );
}
