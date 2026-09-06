import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { WORDS, arPlural, formatDateTime } from "../../lib/format";

interface Row {
  user_id: string;
  user_name: string;
  user_role: "admin" | "worker";
  batches_count: number;
  last_scan: string | null;
}

export default function Compliance() {
  const [days, setDays] = useState(7);
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.rpc("compliance_report", { p_days: days });
      setRows((data ?? []) as Row[]);
    })();
  }, [days]);

  const total = rows.reduce((s, r) => s + Number(r.batches_count), 0);

  return (
    <>
      <div className="card">
        <h2>من صوّر ومن لم يصوّر</h2>
        <p className="hint">مجموع ما سُجّل خلال المدة: {arPlural(total, WORDS.carton)}.</p>
        <div className="btn-row">
          {[7, 30, 90].map((d) => (
            <button key={d} className={`btn small ${days === d ? "" : "secondary"}`} onClick={() => setDays(d)}>
              آخر {arPlural(d, WORDS.day)}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr><th>الاسم</th><th>الدور</th><th>كراتين</th><th>آخر تسجيل</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.user_id}>
                <td>{r.user_name}</td>
                <td>{r.user_role === "admin" ? "مدير" : "عامل"}</td>
                <td>
                  <span className={`badge ${Number(r.batches_count) === 0 ? "expired" : "ok"}`}>
                    {Number(r.batches_count).toLocaleString("ar-IQ")}
                  </span>
                </td>
                <td className="muted">{r.last_scan ? formatDateTime(r.last_scan) : "لم يسجّل أبداً"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
