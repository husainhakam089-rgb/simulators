import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../../lib/auth";
import { catalog, newClientId, type CatalogItem } from "../../lib/db";
import { enqueueBatch, onSyncChange, refreshCatalog, syncNow } from "../../lib/sync";
import { supabase } from "../../lib/supabase";
import { captureFrame, createFrameWatcher, createScanner } from "../../lib/scanner";
import { WORDS, addDays, arPlural, daysLeftLabel, formatDate, riskLevel, toISODate } from "../../lib/format";
import { DatePicker } from "../../components/DatePicker";
import { readDateFromImage, readPackage, warmUpOcr } from "../../lib/ocr";
import type { ProductMatch } from "../../lib/productMatch";

interface Pending {
  scanId: number;                  // يمنع وصول قراءة متأخرة لكارتون سابق
  barcode: string | null;          // قد يكون بلا باركود إطلاقاً
  productId: string | null;
  productName: string | null;
  identifiedBy: "barcode" | "name" | "manual" | "unknown";
  candidates: ProductMatch[];      // اقتراحات أخرى إن كانت المطابقة غير حاسمة
  expiry: string;
  dateSource: "calculated" | "manual" | "ocr";
  confidence: "high" | "low";
  quantity: number;
  photo: Blob | null;
  known: boolean;
  productionDate: string | null;
  note: string | null;
  ocr: "off" | "reading" | "found" | "notfound";
}

const SOURCE_LABEL: Record<Pending["identifiedBy"], string> = {
  barcode: "تعرّف بالباركود",
  name: "تعرّف من اسم العلبة",
  manual: "اخترته بيدك",
  unknown: "صنف غير معروف",
};

const DEFAULT_SHELF_DAYS = 180;

// السقوط التلقائي على قراءة العلبة: لا يعمل إلا بعد أن يمرّ هذا الوقت بلا
// باركود، والكاميرا ثابتة وأمامها شيء. العتبات مقيسة على صور كاميرا حقيقية.
const NO_BARCODE_MS = 2500;
const STEADY_MOTION = 6;    // متوسط فرق الإضاءة بين لقطتين
const MIN_DETAIL = 12;      // انحراف معياري: أقل منه يعني عدسة أمام لا شيء
const STEADY_SAMPLES = 2;

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
  const [picking, setPicking] = useState(false);

  const paused = useRef(false);
  paused.current = pending !== null || manual || picking;
  const scanSeq = useRef(0);
  const lastBarcodeAt = useRef(Date.now());
  const [autoHint, setAutoHint] = useState(false);

  // ------------------------------------------------------ حالة المزامنة
  useEffect(() => {
    const off = onSyncChange((p) => setQueued(p));
    void syncNow();
    void refreshCatalog();
    void warmUpOcr();   // يُحمَّل المحرك بينما يصوّر العامل أول كارتون
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

  // ------------------------------- السقوط التلقائي على قراءة العلبة
  useEffect(() => {
    const watcher = videoRef.current ? createFrameWatcher(videoRef.current) : null;
    if (!watcher) return;
    let steady = 0;

    const timer = window.setInterval(() => {
      if (paused.current) { steady = 0; setAutoHint(false); watcher.reset(); return; }

      const waited = Date.now() - lastBarcodeAt.current;
      if (waited < NO_BARCODE_MS) { steady = 0; setAutoHint(false); return; }

      const s = watcher.sample();
      if (!s) return;
      setAutoHint(true);

      // ثابتة وأمامها شيء؟ عندها نصوّر العلبة بلا ما ننتظر ضغطة
      if (s.motion <= STEADY_MOTION && s.detail >= MIN_DETAIL) steady++;
      else steady = 0;

      if (steady >= STEADY_SAMPLES) {
        steady = 0;
        setAutoHint(false);
        void beginConfirm(null);
      }
    }, 400);

    return () => window.clearInterval(timer);
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
      product_id: row.product_id,
      barcode,
      name: row.product_name,
      category_name: row.category_name,
      default_shelf_life_days: row.default_shelf_life_days,
      alert_before_days: 30,
      is_perishable: row.is_perishable,
    };
  }

  /**
   * يفتح شاشة التأكيد. `code` قد يكون null حين يصوّر العامل علبة بلا باركود —
   * عندها نتعرّف على الصنف من اسمه المطبوع عليها.
   */
  async function beginConfirm(code: string | null) {
    lastCode.current = { code: code ?? "", at: Date.now() };
    lastBarcodeAt.current = Date.now();
    paused.current = true;
    beep();

    const photo = videoRef.current ? await captureFrame(videoRef.current) : null;
    const item = code ? await lookup(code) : null;
    const shelf = item?.default_shelf_life_days ?? DEFAULT_SHELF_DAYS;
    const scanId = ++scanSeq.current;

    setPending({
      scanId,
      barcode: code,
      productId: item?.product_id ?? null,
      productName: item?.name ?? null,
      identifiedBy: item ? "barcode" : "unknown",
      candidates: [],
      expiry: toISODate(addDays(new Date(), shelf)),
      dateSource: "calculated",
      confidence: item ? "high" : "low",
      quantity: 1,
      photo,
      known: !!item,
      productionDate: null,
      note: null,
      ocr: photo ? "reading" : "off",
    });

    if (!photo) return;
    // كل القراءة تجري بالخلفية ولا توقف العامل إطلاقاً
    if (item) void runOcr(photo, scanId, item.default_shelf_life_days ?? null);
    else void runPackage(photo, scanId);
  }

  /**
   * قراءة العلبة كاملة: اسم المنتج والتاريخ معاً. تُستعمل حين لا باركود، أو
   * حين لا يكون الباركود في قائمة المحل.
   */
  async function runPackage(photo: Blob, scanId: number) {
    const items = await catalog.all();
    const result = await readPackage(photo, items, { shelfLifeDays: null });

    setPending((cur) => {
      if (!cur || cur.scanId !== scanId) return cur;
      if (!result.available) return { ...cur, ocr: "off" };

      // المطابقة تعمل على عناصر الكتالوج نفسها، فالعنصر الفائز هو المطلوب
      const matched = result.match.confident
        ? (result.match.best!.item as CatalogItem)
        : undefined;

      // إن عُرف الصنف نستعمل عمر مجموعته لحساب التاريخ حين لا يُقرأ من الصورة
      const shelf = matched?.default_shelf_life_days ?? null;
      const expiry = result.date.expiry
        ?? (shelf ? toISODate(addDays(new Date(), shelf)) : cur.expiry);

      return {
        ...cur,
        productId: matched?.product_id ?? cur.productId,
        productName: matched?.name ?? cur.productName,
        identifiedBy: matched ? "name" : cur.identifiedBy,
        known: !!matched || cur.known,
        candidates: result.match.candidates,
        expiry: cur.dateSource === "manual" ? cur.expiry : expiry,
        dateSource: cur.dateSource === "manual" ? "manual"
          : result.date.expiry ? "ocr" : "calculated",
        productionDate: result.date.production ?? cur.productionDate,
        confidence: "low",   // التعرّف بالاسم يبقى للمراجعة دائماً
        note: [matched ? `طوبق بالاسم من العلبة` : null, result.date.expiry ? result.date.reason : null]
          .filter(Boolean).join(" — ") || null,
        ocr: result.date.expiry ? "found" : "notfound",
      };
    });
  }

  /** العامل يختار الصنف من الاقتراحات بنفسه */
  function pickCandidate(m: ProductMatch) {
    const matched = m.item as CatalogItem;
    setPending((cur) => {
      if (!cur) return cur;
      const shelf = matched.default_shelf_life_days ?? null;
      return {
        ...cur,
        productId: matched.product_id ?? null,
        productName: matched.name,
        identifiedBy: "manual",
        known: true,
        expiry: cur.dateSource === "ocr" || cur.dateSource === "manual"
          ? cur.expiry
          : shelf ? toISODate(addDays(new Date(), shelf)) : cur.expiry,
      };
    });
    setPicking(false);
  }

  /**
   * تُطبَّق نتيجة القراءة فقط إذا كان العامل ما زال على نفس الكارتون ولم يعدّل
   * التاريخ بيده — لا نغيّر شيئاً تحت إصبعه.
   */
  async function runOcr(photo: Blob, scanId: number, shelfLifeDays: number | null) {
    const result = await readDateFromImage(photo, { shelfLifeDays });
    setPending((cur) => {
      if (!cur || cur.scanId !== scanId) return cur;
      if (cur.dateSource === "manual") return { ...cur, ocr: "off" };
      if (!result.available) return { ...cur, ocr: "off" };
      if (!result.expiry) return { ...cur, ocr: "notfound" };
      return {
        ...cur,
        expiry: result.expiry,
        productionDate: result.production,
        dateSource: "ocr",
        confidence: cur.known && result.confidence === "high" ? "high" : "low",
        note: result.reason,
        ocr: "found",
      };
    });
  }

  async function handleScan(code: string) {
    lastBarcodeAt.current = Date.now();   // رأينا باركوداً: لا داعي لقراءة العلبة
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
    lastCode.current = { code: p.barcode ?? "", at: Date.now() };

    await enqueueBatch({
      id: newClientId(),
      barcode: p.barcode,
      product_id: p.productId,
      identified_by: p.identifiedBy,
      expiry_date: p.expiry,
      production_date: p.productionDate,
      quantity: p.quantity,
      date_source: p.dateSource,
      confidence: p.known ? p.confidence : "low",
      received_at: new Date().toISOString(),
      product_name: p.productName,
      note: p.note,
      photo: p.photo ?? undefined,
      tries: 0,
    });

    lastBarcodeAt.current = Date.now();
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
      <div className="hint-text">وجّه الكاميرا نحو الباركود — أو على العلبة نفسها</div>

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
        {autoHint && (
          <div className="auto-hint">ما شفت باركود — ثبّت الكاميرا على العلبة وأقرأ اسمها</div>
        )}
        <button className="capture" onClick={() => void beginConfirm(null)}>
          اقرأ العلبة الآن
        </button>
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
            <div className="barcode">{pending.barcode ?? "بلا باركود"}</div>
            <div className="ident">
              <span className={`badge ${pending.identifiedBy === "barcode" ? "ok" : "warn"}`}>
                {SOURCE_LABEL[pending.identifiedBy]}
              </span>
              {(pending.candidates.length > 0 || pending.known) && (
                <button className="link-btn" onClick={() => setPicking(true)}>
                  {pending.known ? "مو هذا الصنف؟" : "اختر الصنف"}
                </button>
              )}
            </div>
            {pending.ocr === "reading" && !pending.known && (
              <div className="reading-note">جارٍ قراءة اسم الصنف من العلبة…</div>
            )}
            {!pending.known && pending.ocr !== "reading" && (
              <div className="error" style={{ marginTop: 12 }}>
                ما عرفنا هذا الصنف — سجّله وأكمل، والمدير يراجعه بالصورة لاحقاً.
              </div>
            )}

            <div className={`date-box ${level === "ok" ? "" : level} ${pending.ocr === "found" ? "read-ok" : ""}`}>
              <div className="d">{formatDate(pending.expiry)}</div>
              <div className="left">{daysLeftLabel(daysLeft)}</div>
              <div className="src">
                {pending.ocr === "reading" && <span className="reading">جارٍ قراءة التاريخ من الصورة…</span>}
                {pending.ocr !== "reading" && (
                  pending.dateSource === "ocr" ? "قُرئ من صورة الكارتون"
                  : pending.dateSource === "manual" ? "أدخلته يدوياً"
                  : pending.ocr === "notfound" ? "لم يظهر تاريخ في الصورة — محسوب من عمر المجموعة"
                  : "محسوب من عمر المجموعة"
                )}
              </div>
              {pending.productionDate && (
                <div className="src">تاريخ الإنتاج المقروء: {formatDate(pending.productionDate)}</div>
              )}
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

      {pending && picking && (
        <div className="sheet" onClick={(e) => { if (e.target === e.currentTarget) setPicking(false); }}>
          <div className="panel">
            <div className="product">اختر الصنف</div>
            <p className="muted" style={{ marginTop: 4 }}>
              {pending.candidates.length > 0
                ? "الأقرب لما قُرئ على العلبة:"
                : "لم نتعرّف على شيء من العلبة."}
            </p>
            {pending.candidates.map((m) => (
              <button key={m.item.barcode} className="candidate" onClick={() => pickCandidate(m)}>
                <span className="cname">{m.item.name}</span>
                {m.item.category_name && <span className="ccat">{m.item.category_name}</span>}
              </button>
            ))}
            <div className="spacer" />
            <button className="btn secondary" onClick={() => setPicking(false)}>رجوع</button>
          </div>
        </div>
      )}

      {pending && editingDate && (
        <DatePicker
          initial={pending.expiry}
          onCancel={() => setEditingDate(false)}
          onDone={(iso) => {
            setPending({ ...pending, expiry: iso, dateSource: "manual", confidence: "high", note: null, ocr: "off" });
            setEditingDate(false);
          }}
        />
      )}

      {toast && <div className="toast ok">{toast}</div>}
    </div>
  );
}
