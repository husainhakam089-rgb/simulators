import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { daysLeftLabel, formatDate, formatDateTime } from "../../lib/format";

interface Row {
  batch_id: string;
  product_name: string;
  barcode: string | null;
  quantity: number;
  expiry_date: string;
  production_date: string | null;
  days_left: number;
  confidence: string;
  date_source: "ocr" | "calculated" | "manual";
  note: string | null;
  is_unknown: boolean;
  received_at: string;
  received_by_name: string | null;
  photo_url: string | null;
}

const SOURCE_LABEL: Record<Row["date_source"], string> = {
  ocr: "قُرئ من الصورة",
  calculated: "محسوب من عمر المجموعة",
  manual: "أدخله العامل",
};

export default function Review() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("v_batch_risk").select("*")
      .eq("status", "active")
      .order("received_at", { ascending: false });
    const list = ((data ?? []) as Row[]).filter((r) => r.is_unknown || r.confidence === "low");
    setRows(list);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function showPhoto(r: Row) {
    if (!r.photo_url || photos[r.batch_id]) return;
    const { data } = await supabase.storage.from("batch-photos").createSignedUrl(r.photo_url, 600);
    if (data?.signedUrl) setPhotos((p) => ({ ...p, [r.batch_id]: data.signedUrl }));
  }

  async function markHigh(id: string) {
    await supabase.from("batches").update({ confidence: "high" }).eq("id", id);
    await load();
  }

  if (loading) return <div className="empty">جارٍ التحميل…</div>;
  if (rows.length === 0) return <div className="empty">لا شيء يحتاج مراجعة. ممتاز.</div>;

  return (
    <>
      <div className="card">
        <h2>أصناف مجهولة وتواريخ منخفضة الثقة</h2>
        <p className="hint" style={{ margin: 0 }}>
          العامل لا يتوقف عند باركود غير معروف — يُسجَّل هنا وتراجعه أنت.
        </p>
      </div>

      {rows.map((r) => (
        <div className="risk-row warn" key={r.batch_id}>
          <div className="name">{r.product_name}</div>
          <div className="meta" dir="ltr" style={{ textAlign: "right" }}>{r.barcode}</div>
          <div className="meta">
            {formatDate(r.expiry_date)} · {daysLeftLabel(r.days_left)} ·
            العدد {Number(r.quantity).toLocaleString("ar-IQ")}
          </div>
          <div className="meta">
            {r.received_by_name ?? "—"} · {formatDateTime(r.received_at)}
          </div>
          <div className="meta">
            {r.is_unknown && <span className="badge expired">باركود غير معروف</span>}{" "}
            {r.confidence === "low" && <span className="badge warn">ثقة منخفضة</span>}{" "}
            <span className="badge gray">{SOURCE_LABEL[r.date_source]}</span>
          </div>
          {r.production_date && (
            <div className="meta">تاريخ الإنتاج المقروء: {formatDate(r.production_date)}</div>
          )}
          {r.note && <div className="meta">{r.note}</div>}

          {photos[r.batch_id] && (
            <img src={photos[r.batch_id]} alt="صورة الكارتون"
                 style={{ width: "100%", borderRadius: 12, marginTop: 10 }} />
          )}

          <div className="actions">
            {r.photo_url && !photos[r.batch_id] && (
              <button className="btn secondary" onClick={() => void showPhoto(r)}>شوف الصورة</button>
            )}
            {r.confidence === "low" && (
              <button className="btn" onClick={() => void markHigh(r.batch_id)}>التاريخ صحيح</button>
            )}
          </div>

          {r.is_unknown && (
            <p className="muted" style={{ fontSize: 14, marginBottom: 0 }}>
              أضف هذا الباركود لملف نظام المبيعات ثم أعد الاستيراد — عندها يرتبط تلقائياً.
            </p>
          )}
        </div>
      ))}
    </>
  );
}
