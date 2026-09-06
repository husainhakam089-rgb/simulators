// «جرّب القراءة» — شاشة للمدير يقيس بها البرنامج على بضاعته هو.
//
// سبب وجودها: كل قياساتنا جرت على صور نرسمها نحن، وهي تخمين لشكل بضاعة المحل.
// هنا يصوّر المدير كارتوناً حقيقياً فيرى بعينه ماذا قرأ كل محرك حرفاً بحرف:
// السحابي والمحلي، النص الخام والتاريخ المستخرج والصنف المطابَق. فإن أخطأ
// البرنامج عرفنا أين أخطأ بالضبط بدل أن نخمّن.
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import { readTextInCloud, cloudConfigured } from "../../lib/cloudOcr";
import { readDatesFromText } from "../../lib/dateParse";
import { matchProduct } from "../../lib/productMatch";
import { readPackage } from "../../lib/ocr";
import { formatDate, formatNumber } from "../../lib/format";
import type { CatalogItem } from "../../lib/db";

interface Engine {
  label: string;
  ms: number;
  text: string;
  expiry: string | null;
  confidence: "high" | "low";
  reason: string;
  product: string | null;
  score: number | null;
  confident: boolean;
  failed: string | null;
}

interface Row {
  name: string;
  url: string;
  cloud: Engine | null;
  device: Engine | null;
  busy: boolean;
}

const EMPTY: Omit<Engine, "label" | "ms"> = {
  text: "", expiry: null, confidence: "low", reason: "", product: null,
  score: null, confident: false, failed: null,
};

function analyze(label: string, ms: number, text: string, items: CatalogItem[]): Engine {
  const date = readDatesFromText(text, { ocrConfidence: 92 });
  const match = matchProduct(text, items);
  return {
    ...EMPTY, label, ms, text,
    expiry: date.expiry,
    confidence: date.confidence,
    reason: date.reason,
    product: match.best ? (match.best.item as CatalogItem).name : null,
    score: match.best ? Math.round(match.best.score * 100) / 100 : null,
    confident: match.confident,
  };
}

export default function CheckReading() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [cloudOn, setCloudOn] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.rpc("worker_catalog");
      setItems((data ?? []) as CatalogItem[]);
    })();
    void cloudConfigured().then(setCloudOn);
  }, []);

  const run = useCallback(async (files: File[]) => {
    const fresh: Row[] = files.map((f) => ({
      name: f.name, url: URL.createObjectURL(f), cloud: null, device: null, busy: true,
    }));
    setRows((prev) => [...fresh, ...prev]);

    // واحدة واحدة لا دفعة: قراءتان ثقيلتان بالتوازي تخنقان المتصفح على الموبايل
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const row = fresh[i];

      let cloud: Engine;
      const t0 = performance.now();
      const res = await readTextInCloud(file);
      if (res.ok) {
        cloud = analyze("سحابي", Math.round(performance.now() - t0), res.text, items);
      } else {
        cloud = { ...EMPTY, label: "سحابي", ms: Math.round(performance.now() - t0),
                  failed: res.reason === "not_configured" ? "المفتاح غير مضبوط" : `تعذّر: ${res.reason}` };
      }
      setRows((prev) => prev.map((r) => (r.url === row.url ? { ...r, cloud } : r)));

      const t1 = performance.now();
      const local = await readPackage(file, items, {});
      const device = local.available
        ? analyze("داخل الجهاز", Math.round(performance.now() - t1), local.text, items)
        : { ...EMPTY, label: "داخل الجهاز", ms: 0, failed: "المحرك غير متاح" };
      setRows((prev) => prev.map((r) => (r.url === row.url ? { ...r, device, busy: false } : r)));
    }
  }, [items]);

  /** تقرير نصي يرسله المدير كما هو — نص لا صور، فلا تغادر بضاعته جهازه */
  function report(): string {
    const lines: string[] = [];
    for (const r of rows) {
      lines.push(`— ${r.name}`);
      for (const e of [r.cloud, r.device]) {
        if (!e) continue;
        if (e.failed) { lines.push(`  ${e.label}: ${e.failed}`); continue; }
        lines.push(`  ${e.label} (${e.ms} م.ث): تاريخ=${e.expiry ?? "لا شيء"} [${e.confidence}] صنف=${e.product ?? "لا شيء"}${e.confident ? " ✔" : ""}`);
        lines.push(`    النص: ${e.text.replace(/\s+/g, " ").trim().slice(0, 300)}`);
      }
    }
    return lines.join("\n");
  }

  const done = rows.filter((r) => !r.busy);
  const cloudHits = done.filter((r) => r.cloud?.expiry && r.cloud.confidence === "high").length;
  const deviceHits = done.filter((r) => r.device?.expiry && r.device.confidence === "high").length;
  const nameHits = done.filter((r) => r.cloud?.confident || r.device?.confident).length;

  return (
    <>
      <div className="card">
        <h2>جرّب القراءة على بضاعتك</h2>
        <p className="hint">
          صوّر كارتوناً حقيقياً من محلك — يُفضّل ٣ إلى ٥ كراتين مختلفة — وشوف بعينك
          شنو قرأ البرنامج. هذه الشاشة لا تحفظ شيئاً ولا تسجّل وجبة؛ للفحص فقط.
        </p>
        {cloudOn === false && (
          <p className="hint">
            ⚠️ القراءة الدقيقة غير مفعّلة، فالفحص يقيس محرك الموبايل وحده.
          </p>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          hidden
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = "";
            if (files.length) void run(files);
          }}
        />
        <button className="primary" onClick={() => fileRef.current?.click()}>
          📷 صوّر كارتوناً أو اختر صوراً
        </button>

        {done.length > 0 && (
          <p className="hint">
            من {formatNumber(done.length)}: التاريخ سحابياً {formatNumber(cloudHits)}، التاريخ
            بالموبايل {formatNumber(deviceHits)}، الصنف {formatNumber(nameHits)}.
          </p>
        )}
      </div>

      {rows.length === 0 && <div className="empty">ما جرّبت بعد.</div>}

      {rows.map((r) => (
        <div className="card" key={r.url}>
          <div className="check-row">
            <img src={r.url} alt="" className="check-shot" />
            <div className="check-engines">
              {r.busy && !r.cloud && <p className="muted">جارٍ القراءة…</p>}
              {[r.cloud, r.device].map((e, i) =>
                e ? (
                  <div className="check-engine" key={i}>
                    <strong>{e.label}</strong>
                    {e.failed ? (
                      <p className="muted">{e.failed}</p>
                    ) : (
                      <>
                        <p>
                          التاريخ:{" "}
                          {e.expiry
                            ? <b className={e.confidence === "high" ? "ok" : "warn"}>
                                {formatDate(e.expiry)}{e.confidence === "high" ? "" : " (غير واثق)"}
                              </b>
                            : <span className="muted">لا شيء</span>}
                          {e.reason ? <span className="muted"> — {e.reason}</span> : null}
                        </p>
                        <p>
                          الصنف:{" "}
                          {e.product
                            ? <b className={e.confident ? "ok" : "warn"}>{e.product}{e.confident ? "" : " (غير حاسم)"}</b>
                            : <span className="muted">لا شيء</span>}
                          {e.score !== null ? <span className="muted"> — درجة {e.score}</span> : null}
                        </p>
                        <p className="muted">{formatNumber(e.ms)} م.ث — قرأ: «{e.text.replace(/\s+/g, " ").trim().slice(0, 160) || "لا شيء"}»</p>
                      </>
                    )}
                  </div>
                ) : null,
              )}
            </div>
          </div>
        </div>
      ))}

      {done.length > 0 && (
        <div className="card">
          <button
            onClick={() => {
              void navigator.clipboard?.writeText(report()).then(() => {
                setCopied(true);
                window.setTimeout(() => setCopied(false), 2500);
              });
            }}
          >
            {copied ? "✔ انتسخ" : "انسخ النتيجة نصاً"}
          </button>
          <p className="hint">
            النص وحده يكفي لإصلاح ما أخطأ فيه البرنامج — ما تحتاج تبعث الصور.
          </p>
        </div>
      )}
    </>
  );
}
