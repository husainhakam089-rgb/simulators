import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "../../lib/supabase";
import { WORDS, arPlural } from "../../lib/format";

type Mapping = Record<string, string>;   // حقل النظام ← اسم العمود في الملف

const FIELDS: { key: string; label: string; required?: boolean }[] = [
  { key: "barcode", label: "الباركود", required: true },
  { key: "name", label: "اسم الصنف", required: true },
  { key: "category", label: "المجموعة" },
  { key: "cost_price", label: "سعر الكلفة" },
  { key: "sell_price", label: "سعر البيع" },
  { key: "unit", label: "الوحدة" },
];

// أسماء أعمدة شائعة بالعربي والإنجليزي — تختلف من نظام مبيعات لآخر
const GUESSES: Record<string, string[]> = {
  barcode: ["باركود", "الباركود", "باركود المادة", "barcode", "bar code", "ean", "upc", "code", "الرمز", "رمز المادة"],
  name: ["الاسم", "اسم المادة", "اسم الصنف", "المادة", "الصنف", "name", "item", "item name", "product", "description", "الوصف"],
  category: ["المجموعة", "التصنيف", "القسم", "الفئة", "category", "group", "department", "class"],
  cost_price: ["الكلفة", "سعر الكلفة", "سعر الشراء", "cost", "cost price", "purchase price", "buy"],
  sell_price: ["سعر البيع", "البيع", "المفرد", "sell", "sale price", "price", "retail"],
  unit: ["الوحدة", "وحدة القياس", "unit", "uom"],
};

function normalize(s: string) {
  return String(s).trim().toLowerCase()
    .replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي")
    .replace(/[ً-ْ]/g, "").replace(/\s+/g, " ");
}

function guessMapping(headers: string[]): Mapping {
  const map: Mapping = {};
  for (const [field, options] of Object.entries(GUESSES)) {
    const opts = options.map(normalize);
    const hit = headers.find((h) => opts.includes(normalize(h)))
      ?? headers.find((h) => opts.some((o) => normalize(h).includes(o)));
    if (hit) map[field] = hit;
  }
  return map;
}

export default function Import() {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [mapping, setMapping] = useState<Mapping>({});
  const [saved, setSaved] = useState<Mapping | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from("import_mappings").select("mapping").eq("name", "default").maybeSingle();
      if (data?.mapping) setSaved(data.mapping as Mapping);
    })();
  }, []);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null); setResult(null);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      if (json.length === 0) throw new Error("الملف فارغ");
      const hs = Object.keys(json[0]);
      setHeaders(hs);
      setRows(json);
      const guessed = guessMapping(hs);
      // المطابقة المحفوظة أولاً، ثم التخمين لما ينقص
      const merged: Mapping = { ...guessed };
      if (saved) for (const [k, v] of Object.entries(saved)) if (hs.includes(v)) merged[k] = v;
      setMapping(merged);
    } catch (err) {
      setError(`تعذّر قراءة الملف: ${(err as Error).message}`);
    }
  }

  async function run() {
    setBusy(true); setError(null); setResult(null);
    try {
      const payload = rows.map((r) => {
        const out: Record<string, string> = {};
        for (const f of FIELDS) {
          const col = mapping[f.key];
          if (col) out[f.key] = String(r[col] ?? "").trim();
        }
        return out;
      }).filter((r) => r.barcode && r.name);

      if (payload.length === 0) throw new Error("لا توجد صفوف فيها باركود واسم");

      // دفعات، لأن ملفات المبيعات قد تكون بآلاف الصفوف
      let ins = 0, upd = 0, skip = 0, cats = 0;
      for (let i = 0; i < payload.length; i += 500) {
        const chunk = payload.slice(i, i + 500);
        const { data, error } = await supabase.rpc("import_products", { p_rows: chunk });
        if (error) throw new Error(error.message);
        const r = Array.isArray(data) ? data[0] : data;
        ins += r.inserted; upd += r.updated; skip += r.skipped; cats += r.categories_created;
      }

      await supabase.from("import_mappings")
        .upsert({ name: "default", mapping, store_id: (await supabase.rpc("current_store_id")).data },
                { onConflict: "store_id,name" });

      setResult(
        `أُضيف ${arPlural(ins, WORDS.item)}، وحُدّث ${upd.toLocaleString("ar-IQ")}، ` +
        `وتُخطّي ${arPlural(skip, WORDS.row)} ناقصة الباركود أو الاسم. ` +
        (cats > 0 ? `أُنشئت ${arPlural(cats, WORDS.category)} جديدة — اضبط أعمارها الآن.` : ""),
      );
    } catch (err) {
      setError(String((err as Error).message));
    } finally {
      setBusy(false);
    }
  }

  const ready = !!mapping.barcode && !!mapping.name;

  return (
    <>
      <div className="card">
        <h2>استيراد الأصناف</h2>
        <p className="hint">
          صدّر ملف الأصناف من نظام المبيعات (Excel أو CSV) وارفعه هنا. الاستيراد التالي يحدّث الموجود
          ويضيف الجديد بلا تكرار. لا تكتب أي بيانات بيدك.
        </p>
        {error && <div className="error">{error}</div>}
        {result && <div className="success">{result}</div>}
        <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => void onFile(e)} />
      </div>

      {headers.length > 0 && (
        <div className="card">
          <h2>مطابقة الأعمدة</h2>
          <p className="hint">
            {arPlural(rows.length, WORDS.row)} في الملف. راجع المطابقة — تُحفظ ولا تتكرر بالمرة القادمة.
          </p>
          {FIELDS.map((f) => (
            <label className="field" key={f.key}>
              <span>{f.label}{f.required ? " *" : ""}</span>
              <select value={mapping[f.key] ?? ""}
                      onChange={(e) => setMapping({ ...mapping, [f.key]: e.target.value })}>
                <option value="">— لا يوجد —</option>
                {headers.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </label>
          ))}
          <button className="btn" disabled={!ready || busy} onClick={() => void run()}>
            {busy ? "جارٍ الاستيراد…" : "استيراد"}
          </button>
        </div>
      )}
    </>
  );
}
