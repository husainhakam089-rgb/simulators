import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { WORDS, arPlural, daysLeftLabel, formatDate, formatMoneyFull, riskLevel } from "../../lib/format";

interface Row {
  batch_id: string;
  product_name: string;
  barcode: string | null;
  category_name: string | null;
  quantity: number;
  expiry_date: string;
  days_left: number;
  alert_before_days: number;
  value_at_risk: number;
  confidence: string;
  received_by_name: string | null;
  is_unknown: boolean;
}

const ACTIONS: { key: string; label: string; cls?: string }[] = [
  { key: "discount", label: "تنزيل سعر" },
  { key: "return", label: "إرجاع للمجهّز", cls: "secondary" },
  { key: "transfer", label: "نقل لفرع", cls: "secondary" },
  { key: "dispose", label: "إتلاف", cls: "danger" },
];

export default function Alerts() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    // مرتّبة حسب المبلغ، لا حسب التاريخ
    const { data } = await supabase
      .from("v_batch_risk")
      .select("*")
      .eq("status", "active")
      .eq("is_perishable", true)
      .order("value_at_risk", { ascending: false });
    const list = ((data ?? []) as Row[]).filter((r) => r.days_left <= r.alert_before_days);
    setRows(list);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function act(batchId: string, action: string) {
    setBusy(batchId);
    await supabase.rpc("record_action", { p_batch_id: batchId, p_action: action, p_note: null });
    setBusy(null);
    await load();
  }

  if (loading) return <div className="empty">جارٍ التحميل…</div>;
  if (rows.length === 0) return <div className="empty">لا يوجد ما يحتاج قراراً اليوم.</div>;

  const total = rows.reduce((s, r) => s + Number(r.value_at_risk), 0);

  return (
    <>
      <div className="card">
        <h2>{arPlural(rows.length, WORDS.batch)} تحتاج قراراً</h2>
        <p className="hint" style={{ margin: 0 }}>
          مجموع القيمة المعرّضة: {formatMoneyFull(total)} دينار — الأعلى مبلغاً أولاً.
        </p>
      </div>

      {rows.map((r) => {
        const lvl = riskLevel(r.days_left, r.alert_before_days);
        return (
          <div key={r.batch_id} className={`risk-row ${lvl}`}>
            <div className="name">{r.product_name}</div>
            <div className="meta">
              {r.category_name ?? "بلا مجموعة"} · العدد {Number(r.quantity).toLocaleString("ar-IQ")} ·
              {" "}{formatDate(r.expiry_date)}
            </div>
            <div className="meta">
              <span className={`badge ${lvl}`}>{daysLeftLabel(r.days_left)}</span>{" "}
              {r.confidence === "low" && <span className="badge gray">ثقة منخفضة</span>}{" "}
              {r.received_by_name && <span className="muted">سجّلها {r.received_by_name}</span>}
            </div>
            <div className="money">{formatMoneyFull(r.value_at_risk)} دينار</div>
            <div className="actions">
              {ACTIONS.map((a) => (
                <button key={a.key} className={`btn ${a.cls ?? ""}`}
                        disabled={busy === r.batch_id}
                        onClick={() => void act(r.batch_id, a.key)}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}
