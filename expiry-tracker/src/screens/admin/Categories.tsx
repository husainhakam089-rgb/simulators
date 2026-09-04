import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { WORDS, arPlural } from "../../lib/format";

interface Category {
  id: string;
  name: string;
  default_shelf_life_days: number | null;
  alert_before_days: number;
  is_perishable: boolean;
}

/** قائمة سريعة — محل كامل يُنجَز خلال نصف ساعة، بلا شاشة لكل مجموعة */
export default function Categories() {
  const [rows, setRows] = useState<Category[]>([]);
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.from("categories").select("*").order("name");
      setRows((data ?? []) as Category[]);
    })();
  }, []);

  function update(id: string, patch: Partial<Category>) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    setDirty((d) => new Set(d).add(id));
    setMsg(null);
  }

  async function saveAll() {
    setSaving(true);
    const changed = rows.filter((r) => dirty.has(r.id));
    for (const r of changed) {
      await supabase.from("categories").update({
        default_shelf_life_days: r.default_shelf_life_days,
        alert_before_days: r.alert_before_days,
        is_perishable: r.is_perishable,
      }).eq("id", r.id);
    }
    setDirty(new Set());
    setSaving(false);
    setMsg(`حُفظت ${arPlural(changed.length, WORDS.category)}.`);
  }

  if (rows.length === 0) {
    return <div className="empty">لا توجد مجموعات بعد — استورد ملف الأصناف أولاً.</div>;
  }

  return (
    <>
      <div className="card">
        <h2>أعمار المجموعات</h2>
        <p className="hint">
          حدّد لكل مجموعة عمرها الافتراضي بالأيام، ومتى يبدأ التنبيه. المجموعة غير القابلة للتلف لا تُنبّه أصلاً.
        </p>
        {msg && <div className="success">{msg}</div>}
        <button className="btn" disabled={saving || dirty.size === 0} onClick={() => void saveAll()}>
          {saving ? "جارٍ الحفظ…" : dirty.size ? `حفظ ${arPlural(dirty.size, WORDS.change)}` : "لا تغييرات"}
        </button>
      </div>

      {rows.map((r) => (
        <div className="card" key={r.id} style={{ padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <strong style={{ flex: 1, fontSize: 17 }}>{r.name}</strong>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14 }}>
              <input type="checkbox" style={{ width: 22, height: 22 }}
                     checked={r.is_perishable}
                     onChange={(e) => update(r.id, { is_perishable: e.target.checked })} />
              لها صلاحية
            </label>
          </div>
          {r.is_perishable && (
            <div className="grid two">
              <label className="field" style={{ marginBottom: 0 }}>
                <span>العمر الافتراضي (يوم)</span>
                <input type="number" inputMode="numeric" min={1} dir="ltr"
                       value={r.default_shelf_life_days ?? ""}
                       onChange={(e) => update(r.id, {
                         default_shelf_life_days: e.target.value === "" ? null : Number(e.target.value),
                       })} />
              </label>
              <label className="field" style={{ marginBottom: 0 }}>
                <span>ينبّه قبل (يوم)</span>
                <input type="number" inputMode="numeric" min={1} dir="ltr"
                       value={r.alert_before_days}
                       onChange={(e) => update(r.id, { alert_before_days: Number(e.target.value) })} />
              </label>
            </div>
          )}
        </div>
      ))}
    </>
  );
}
