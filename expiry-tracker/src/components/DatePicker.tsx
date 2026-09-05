import { useState } from "react";
import { addMonths, daysLeftLabel, formatDate, toISODate } from "../lib/format";

/**
 * إدخال التاريخ بلوحة أرقام كبيرة أو باختصارات جاهزة — لا حقل نص حر أبداً.
 */
export function DatePicker({
  initial, onCancel, onDone,
}: {
  initial: string;
  onCancel: () => void;
  onDone: (iso: string) => void;
}) {
  const init = new Date(initial + "T00:00:00");
  const [digits, setDigits] = useState<string>(
    `${String(init.getDate()).padStart(2, "0")}${String(init.getMonth() + 1).padStart(2, "0")}${init.getFullYear()}`,
  );

  const dd = digits.slice(0, 2);
  const mm = digits.slice(2, 4);
  const yyyy = digits.slice(4, 8);
  const complete = digits.length === 8;

  const iso = (() => {
    if (!complete) return null;
    const d = Number(dd), m = Number(mm), y = Number(yyyy);
    if (m < 1 || m > 12 || d < 1 || d > 31 || y < 2020 || y > 2100) return null;
    const date = new Date(y, m - 1, d);
    if (date.getMonth() !== m - 1 || date.getDate() !== d) return null;
    return toISODate(date);
  })();

  const daysLeft = iso
    ? Math.round((new Date(iso + "T00:00:00").getTime() - new Date(toISODate(new Date()) + "T00:00:00").getTime()) / 86400000)
    : null;

  function press(key: string) {
    if (key === "back") setDigits((d) => d.slice(0, -1));
    else if (digits.length < 8) setDigits((d) => d + key);
  }

  function preset(months: number) {
    onDone(toISODate(addMonths(new Date(), months)));
  }

  const activeSeg = digits.length < 2 ? 0 : digits.length < 4 ? 1 : 2;

  return (
    <div className="sheet" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="panel">
        <div className="product">تعديل تاريخ الانتهاء</div>

        <div className="presets">
          <button onClick={() => preset(1)}>بعد شهر</button>
          <button onClick={() => preset(3)}>بعد ٣ أشهر</button>
          <button onClick={() => preset(6)}>بعد ٦ أشهر</button>
          <button onClick={() => preset(12)}>بعد سنة</button>
        </div>

        <div className="date-entry">
          <div className={`seg ${activeSeg === 0 ? "active" : ""}`}>
            <div className="v">{dd.padEnd(2, "-")}</div><div className="k">يوم</div>
          </div>
          <div className={`seg ${activeSeg === 1 ? "active" : ""}`}>
            <div className="v">{mm.padEnd(2, "-")}</div><div className="k">شهر</div>
          </div>
          <div className={`seg ${activeSeg === 2 ? "active" : ""}`}>
            <div className="v">{yyyy.padEnd(4, "-")}</div><div className="k">سنة</div>
          </div>
        </div>

        <div className="center muted" style={{ minHeight: 28 }}>
          {iso ? `${formatDate(iso)} — ${daysLeftLabel(daysLeft!)}` : "أكمل التاريخ"}
        </div>

        <div className="keypad">
          {["1","2","3","4","5","6","7","8","9"].map((k) => (
            <button key={k} onClick={() => press(k)}>{Number(k).toLocaleString("ar-IQ")}</button>
          ))}
          <button onClick={() => press("back")}>⌫</button>
          <button onClick={() => press("0")}>{(0).toLocaleString("ar-IQ")}</button>
          <button onClick={() => setDigits("")}>مسح</button>
        </div>

        <div className="spacer" />
        <button className="btn" disabled={!iso} onClick={() => iso && onDone(iso)}>حفظ التاريخ</button>
        <div className="spacer" />
        <button className="btn secondary" onClick={onCancel}>رجوع</button>
      </div>
    </div>
  );
}
