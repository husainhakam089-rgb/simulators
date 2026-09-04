import { test } from "node:test";
import assert from "node:assert/strict";
import { readDatesFromText, normalizeDigits } from "./.build/dateParse.js";

const TODAY = new Date(2026, 8, 4);        // ٤ أيلول ٢٠٢٦
const read = (text, opts = {}) => readDatesFromText(text, { today: TODAY, ...opts });

test("الأرقام العربية تُحوَّل", () => {
  assert.equal(normalizeDigits("١٨/٠٩/٢٠٢٦"), "18/09/2026");
});

test("يوم/شهر/سنة بالعرف العراقي", () => {
  assert.equal(read("EXP 18/09/2027").expiry, "2027-09-18");
  assert.equal(read("EXP 18.09.2027").expiry, "2027-09-18");
  assert.equal(read("EXP 18-09-27").expiry, "2027-09-18");
});

test("تاريخ بأرقام عربية على الكارتون", () => {
  assert.equal(read("انتهاء ١٨/٠٩/٢٠٢٧").expiry, "2027-09-18");
});

test("سنة أولاً", () => {
  assert.equal(read("EXP 2027-09-18").expiry, "2027-09-18");
});

test("ترتيب أمريكي يُكتشف من الشهر > ١٢", () => {
  assert.equal(read("EXP 09/18/2027").expiry, "2027-09-18");
});

test("شهر/سنة فقط ← آخر يوم في الشهر", () => {
  assert.equal(read("BEST BEFORE 09/2027").expiry, "2027-09-30");
  assert.equal(read("EXP 02/2028").expiry, "2028-02-29");   // سنة كبيسة
});

test("شهر إنجليزي مختصر", () => {
  assert.equal(read("EXP 18 SEP 2027").expiry, "2027-09-18");
  assert.equal(read("BEST BEFORE SEP 2027").expiry, "2027-09-30");
});

test("تاريخان بلا كلمات: الأبعد هو الانتهاء والأقرب هو الإنتاج", () => {
  const r = read("10/03/2026\n10/03/2028");
  assert.equal(r.expiry, "2028-03-10");
  assert.equal(r.production, "2026-03-10");
  assert.equal(r.confidence, "high");
});

test("كلمتان صريحتان: الإنتاج والانتهاء يُفصلان صح", () => {
  const r = read("MFG 01/06/2026\nEXP 01/06/2028");
  assert.equal(r.expiry, "2028-06-01");
  assert.equal(r.production, "2026-06-01");
  assert.equal(r.confidence, "high");
});

test("كلمتان في سطر واحد", () => {
  const r = read("MFG 01/06/2026 EXP 01/06/2028");
  assert.equal(r.expiry, "2028-06-01");
  assert.equal(r.production, "2026-06-01");
});

test("إنتاج فقط ← يُشتق الانتهاء من عمر المجموعة، بثقة منخفضة", () => {
  const r = read("MFG 01/09/2026", { shelfLifeDays: 180 });
  assert.equal(r.expiry, "2027-02-28");
  assert.equal(r.production, "2026-09-01");
  assert.equal(r.confidence, "low");
});

test("تاريخ واحد في المستقبل ← انتهاء", () => {
  const r = read("18/09/2027");
  assert.equal(r.expiry, "2027-09-18");
  assert.equal(r.confidence, "high");
});

test("تاريخ واحد في الماضي مع عمر مجموعة ← يُعامل كإنتاج", () => {
  const r = read("01/08/2026", { shelfLifeDays: 365 });
  assert.equal(r.production, "2026-08-01");
  assert.equal(r.expiry, "2027-08-01");
  assert.equal(r.confidence, "low");
});

test("تاريخ واحد في الماضي بلا عمر مجموعة ← صنف منتهٍ، ثقة منخفضة", () => {
  const r = read("01/08/2026");
  assert.equal(r.expiry, "2026-08-01");
  assert.equal(r.confidence, "low");
});

test("رقم التشغيلة لا يُقرأ كتاريخ", () => {
  const r = read("LOT 180926\nBATCH 45210");
  assert.equal(r.expiry, null);
});

test("لكن الرقم المضغوط مع كلمة صريحة يُقبل", () => {
  assert.equal(read("EXP 18092027").expiry, "2027-09-18");
});

test("شهر/سنة بسنتين تُقبل فقط مع كلمة صريحة", () => {
  assert.equal(read("09/27").expiry, null);
  assert.equal(read("EXP 09/27").expiry, "2027-09-30");
});

test("تواريخ خارج المدى المعقول تُرفض", () => {
  assert.equal(read("EXP 18/09/2045").expiry, null);
  assert.equal(read("EXP 18/09/1998").expiry, null);
});

test("تاريخ غير صحيح يُرفض", () => {
  assert.equal(read("EXP 31/02/2027").expiry, null);
});

test("ثقة محرك القراءة المنخفضة تخفض الثقة", () => {
  const r = read("EXP 18/09/2027", { ocrConfidence: 40 });
  assert.equal(r.expiry, "2027-09-18");
  assert.equal(r.confidence, "low");
});

test("نص فوضوي حول التاريخ لا يمنع القراءة", () => {
  const r = read("NET WT 400G\nBARCODE 6281000012345\nBEST BEFORE END: 03/2028\nMADE IN TURKEY");
  assert.equal(r.expiry, "2028-03-31");
  assert.equal(r.confidence, "high");
});

test("لا تاريخ إطلاقاً", () => {
  const r = read("MILK 1L\nKEEP REFRIGERATED");
  assert.equal(r.expiry, null);
  assert.equal(r.confidence, "low");
});

test("كلمة عربية صريحة", () => {
  assert.equal(read("تاريخ الانتهاء ١٨/٠٩/٢٠٢٧").expiry, "2027-09-18");
  const r = read("تاريخ الانتاج ٠١/٠٩/٢٠٢٦", { shelfLifeDays: 90 });
  assert.equal(r.production, "2026-09-01");
});
