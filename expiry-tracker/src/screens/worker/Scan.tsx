import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../../lib/auth";
import { catalog, newClientId, type CatalogItem } from "../../lib/db";
import { enqueueBatch, onSyncChange, refreshCatalog, syncNow } from "../../lib/sync";
import { supabase } from "../../lib/supabase";
import { captureFrame, createScanner } from "../../lib/scanner";
import { WORDS, addDays, arPlural, daysLeftLabel, formatDate, riskLevel, toISODate } from "../../lib/format";
import { DatePicker } from "../../components/DatePicker";

interface Pending {
  barcode: string;
  productName: string | null;
  expiry: string;
  dateSource: "calculated" | "manual";
  quantity: number;
  photo: Blob | null;
  known: boolean;
}

const DEFAULT_SHELF_DAYS = 180;

export default function Scan() {
  const { profile, storeName, signOut } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastCode = useRef<{ code: string; at: number }>({ code: "", at: 0 });

  const [pending, setPending] = useState<Pending | null>(null);
  const [editingDate, setEditingDate] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [queued, setQueued] = useState(0);
  const [online, setOnline] = useState(navigator.onLine);
  const [savedToday, setSavedToday] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manual, setManual] = useState(false);
  const [manualCode, setManualCode] = useState("");

  const paused = useRef(false);
  paused.current = pending !== null || manual;

  // ------------------------------------------------------ حالة المزامنة
  useEffect(() => {
    const off = onSyncChange((p) => setQueued(p));
    void syncNow();
    void refreshCatalog();
    const on = () => setOnline(true);
    const offl = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", offl);
    return () => { off(); window.removeEventListener("online", on); window.removeEventListener("offline", offl); };
  }, []);

  // ------------------------------------------------------------ الكاميرا
  useEffect(() => {
    let stopScanner: (() => void) | undefined;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
          audio: false,
        });
        streamRef.current = stream;
        const v = videoRef.current;
        if (!v) return;
        v.srcObject = stream;
        await v.play();
        stopScanner = createScanner(v, (code) => void handleScan(code));
      } catch {
        setCameraError("تعذّر فتح الكاميرا. اسمح للتطبيق باستعمالها من إعدادات المتصفح.");
      }
    })();
    return () => {
      stopScanner?.();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const beep = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = 880; o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.15, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      o.start(); o.stop(ctx.currentTime + 0.16);
      navigator.vibrate?.(60);
    } catch { /* الصوت ليس ضرورياً */ }
  }, []);

  async function lookup(barcode: string): Promise<CatalogItem | null> {
    const local = await catalog.get(barcode);
    if (local) return local;
    if (!navigator.onLine) return null;
    const { data } = await supabase.rpc("worker_lookup", { p_barcode: barcode });
    const row = Array.isArray(data) ? data[0] : null;
    if (!row?.found) return null;
    return {
      barcode,
      name: row.product_name,
      category_name: row.category_name,
      default_shelf_life_days: row.default_shelf_life_days,
      alert_before_days: 30,
      is_perishable: row.is_perishable,
    };
  }

  /** يفتح شاشة التأكيد لباركود معيّن — تُستدعى من الكاميرا ومن الإدخال اليدوي */
  async function beginConfirm(code: string) {
    lastCode.current = { code, at: Date.now() };
    paused.current = true;
    beep();

    const photo = videoRef.current ? await captureFrame(videoRef.current) : null;
    const item = await lookup(code);
    const shelf = item?.default_shelf_life_days ?? DEFAULT_SHELF_DAYS;

    setPending({
      barcode: code,
      productName: item?.name ?? null,
      expiry: toISODate(addDays(new Date(), shelf)),
      dateSource: "calculated",
      quantity: 1,
      photo,
      known: !!item,
    });
  }

  async function handleScan(code: string) {
    if (paused.current) return;
    const now = Date.now();
    if (lastCode.current.code === code && now - lastCode.current.at < 4000) return;
    await beginConfirm(code);
  }

  async function confirm() {
    if (!pending) return;
    const p = pending;
    setPending(null);
    setEditingDate(false);
    lastCode.current = { code: p.barcode, at: Date.now() };

    await enqueueBatch({
      id: newClientId(),
      barcode: p.barcode,
      expiry_date: p.expiry,
      quantity: p.quantity,
      date_source: p.dateSource,
      confidence: p.known ? "high" : "low",
      received_at: new Date().toISOString(),
      product_name: p.productName,
      photo: p.photo ?? undefined,
      tries: 0,
    });

    setSavedToday((n) => n + 1);
    setToast(p.known ? `حُفظ: ${p.productName}` : "حُفظ كصنف مجهول — سيراجعه المدير");
    window.setTimeout(() => setToast(null), 1800);
  }

  const level = pending ? riskLevel(
    Math.round((new Date(pending.expiry + "T00:00:00").getTime() - new Date(toISODate(new Date()) + "T00:00:00").getTime()) / 86400000),
  ) : "ok";
  const daysLeft = pending
    ? Math.round((new Date(pending.expiry + "T00:00:00").getTime() - new Date(toISODate(new Date()) + "T00:00:00").getTime()) / 86400000)
    : 0;

  return (
    <div className="scanner">
      <video ref={videoRef} playsInline muted />
      <div className="frame" />
      <div className="hint-text">وجّه الكاميرا نحو باركود الكارتون</div>

      <div className="bar">
        <div className="who">
          {profile?.name}
          <div style={{ fontSize: 12, opacity: .85, fontWeight: 400 }}>{storeName}</div>
        </div>
        {savedToday > 0 && (
          <span className="pending-pill" style={{ background: "rgba(255,255,255,.2)", color: "#fff" }}>
            سُجّل {arPlural(savedToday, WORDS.carton)}
          </span>
        )}
        {!online && <span className="pending-pill offline-pill">دون اتصال</span>}
        {queued > 0 && (
          <span className="pending-pill">بالانتظار {queued.toLocaleString("ar-IQ")}</span>
        )}
        <button onClick={() => void signOut()}>خروج</button>
      </div>

      <div className="footer">
        {cameraError && <div className="error">{cameraError}</div>}
        <button className="manual" onClick={() => setManual(true)}>إدخال الباركود يدوياً</button>
      </div>

      {/* ---------------------------------------------- إدخال يدوي للباركود */}
      {manual && (
        <div className="sheet" onClick={(e) => { if (e.target === e.currentTarget) setManual(false); }}>
          <div className="panel">
            <div className="product">إدخال الباركود</div>
            <div className="date-entry">
              <div className="seg" style={{ flex: 1 }}>
                <div className="v" style={{ letterSpacing: 1, fontSize: 22 }}>{manualCode || "—"}</div>
                <div className="k">الرقم تحت الباركود</div>
              </div>
            </div>
            <div className="keypad">
              {["1","2","3","4","5","6","7","8","9"].map((k) => (
                <button key={k} onClick={() => setManualCode((c) => c + k)}>{Number(k).toLocaleString("ar-IQ")}</button>
              ))}
              <button onClick={() => setManualCode((c) => c.slice(0, -1))}>⌫</button>
              <button onClick={() => setManualCode((c) => c + "0")}>{(0).toLocaleString("ar-IQ")}</button>
              <button onClick={() => setManualCode("")}>مسح</button>
            </div>
            <div className="spacer" />
            <button
              className="btn"
              disabled={manualCode.length < 4}
              onClick={async () => {
                const c = manualCode;
                setManual(false);
                setManualCode("");
                await beginConfirm(c);
              }}
            >
              متابعة
            </button>
            <div className="spacer" />
            <button className="btn secondary" onClick={() => { setManual(false); setManualCode(""); }}>رجوع</button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------ شاشة التأكيد */}
      {pending && !editingDate && (
        <div className="sheet">
          <div className="panel">
            <div className="product">{pending.productName ?? "صنف غير معروف"}</div>
            <div className="barcode">{pending.barcode}</div>
            {!pending.known && (
              <div className="error" style={{ marginTop: 12 }}>
                هذا الباركود غير موجود في القائمة — سجّله وأكمل، المدير يراجعه لاحقاً.
              </div>
            )}

            <div className={`date-box ${level === "ok" ? "" : level}`}>
              <div className="d">{formatDate(pending.expiry)}</div>
              <div className="left">{daysLeftLabel(daysLeft)}</div>
              <div className="src">
                {pending.dateSource === "calculated" ? "محسوب من عمر المجموعة" : "أدخلته يدوياً"}
              </div>
            </div>

            <div className="qty">
              <button aria-label="زيادة" onClick={() => setPending({ ...pending, quantity: pending.quantity + 1 })}>+</button>
              <div className="n">{pending.quantity.toLocaleString("ar-IQ")}</div>
              <button aria-label="إنقاص" onClick={() => setPending({ ...pending, quantity: Math.max(1, pending.quantity - 1) })}>−</button>
            </div>

            <button className="btn" onClick={() => void confirm()}>تأكيد</button>
            <div className="spacer" />
            <div className="btn-row">
              <button className="btn secondary" onClick={() => setEditingDate(true)}>تعديل التاريخ</button>
              <button className="btn ghost" onClick={() => setPending(null)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {pending && editingDate && (
        <DatePicker
          initial={pending.expiry}
          onCancel={() => setEditingDate(false)}
          onDone={(iso) => { setPending({ ...pending, expiry: iso, dateSource: "manual" }); setEditingDate(false); }}
        />
      )}

      {toast && <div className="toast ok">{toast}</div>}
    </div>
  );
}
