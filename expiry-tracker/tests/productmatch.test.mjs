import { test } from "node:test";
import assert from "node:assert/strict";
import { matchProduct, normalizeText, tokenize } from "./.build/productMatch.js";

// قائمة أصناف تشبه ما يصدّره نظام مبيعات عراقي
const CATALOG = [
  { barcode: "6281000012345", name: "لبن ربيع كامل الدسم ١ لتر", category_name: "ألبان وأجبان" },
  { barcode: "6281000012352", name: "لبن ربيع قليل الدسم ١ لتر", category_name: "ألبان وأجبان" },
  { barcode: "6281000067890", name: "معجون طماطم الكاسر ٨٠٠ غم", category_name: "معلبات" },
  { barcode: "6281000067906", name: "معجون طماطم الكاسر ٤٠٠ غم", category_name: "معلبات" },
  { barcode: "6281000099999", name: "منظف أرضيات ديتول ٢ لتر", category_name: "منظفات" },
  { barcode: "6281000011111", name: "زيت زهرة الشمس ١٫٥ لتر", category_name: "زيوت ودهون" },
  { barcode: "6281000022222", name: "شاي الغزالين ناعم ٤٥٠ غم", category_name: "شاي وقهوة" },
  { barcode: "6281000033333", name: "جبن كيري ٨ مثلثات", category_name: "ألبان وأجبان" },
  { barcode: "6281000044444", name: "Nescafe Gold 200 g", category_name: "شاي وقهوة" },
];

test("توحيد الرسم العربي", () => {
  assert.equal(normalizeText("مَعْجُونْ طَمَاطِمْ"), "معجون طماطم");
  assert.equal(normalizeText("أرضيات"), "ارضيات");
  assert.equal(normalizeText("قهوة"), "قهوه");
  assert.equal(normalizeText("١ لتر"), "1 لتر");
});

test("الكلمات العامة على كل علبة تُستبعد", () => {
  const t = tokenize("صافي الوزن ٤٠٠ غم صنع في العراق معجون طماطم");
  assert.ok(t.includes("معجون"));
  assert.ok(t.includes("طماطم"));
  assert.ok(!t.includes("صافي"));
  assert.ok(!t.includes("الوزن"));
  assert.ok(!t.includes("غم"));
});

test("قراءة نظيفة من العلبة تطابق الصنف الصحيح", () => {
  const r = matchProduct("معجون طماطم الكاسر\nصافي الوزن ٨٠٠ غم\nصنع في العراق", CATALOG);
  assert.equal(r.best.item.barcode, "6281000067890");
  assert.equal(r.confident, true);
});

test("قراءة فيها أخطاء حروف تبقى تطابق", () => {
  // "الكاسر" قُرئت "الكاسو"، و"طماطم" قُرئت "طماطو"
  const r = matchProduct("معجون طماطو الكاسو ٨٠٠ غم", CATALOG);
  assert.equal(r.best.item.barcode, "6281000067890");
});

test("النص الزائد على العلبة لا يضرّ", () => {
  const r = matchProduct(
    "TOMATO PASTE\nمعجون طماطم الكاسر\nHALAL\nصافي الوزن ٨٠٠ غم\nيحفظ في مكان بارد وجاف\nEXP 18/09/2027",
    CATALOG,
  );
  assert.equal(r.best.item.barcode, "6281000067890");
  assert.equal(r.confident, true);
});

test("صنفان متشابهان يختلفان بالوزن: يُعرضان معاً بلا اختيار تلقائي", () => {
  const r = matchProduct("معجون طماطم الكاسر", CATALOG);
  const codes = r.candidates.map((c) => c.item.barcode);
  assert.ok(codes.includes("6281000067890"));
  assert.ok(codes.includes("6281000067906"));
  assert.equal(r.confident, false, "التشابه الشديد يجب أن يعرض خيارات لا أن يقرر");
});

test("الوزن يرجّح الصنف الصحيح بين المتشابهين", () => {
  const r = matchProduct("معجون طماطم الكاسر ٤٠٠ غم صافي الوزن", CATALOG);
  assert.equal(r.best.item.barcode, "6281000067906", "٤٠٠ غم يجب أن تفوز على ٨٠٠ غم");
  const r2 = matchProduct("معجون طماطم الكاسر ٨٠٠ غم صافي الوزن", CATALOG);
  assert.equal(r2.best.item.barcode, "6281000067890");
});

test("اسم إنجليزي على العلبة يطابق صنفاً إنجليزياً", () => {
  const r = matchProduct("NESCAFE GOLD\nINSTANT COFFEE\n200 g", CATALOG);
  assert.equal(r.best.item.barcode, "6281000044444");
});

test("علبة لا علاقة لها بالقائمة لا تُطابَق", () => {
  const r = matchProduct("SAMSUNG GALAXY CHARGER 25W USB-C", CATALOG);
  assert.equal(r.best, null);
  assert.equal(r.candidates.length, 0);
});

test("نص فارغ أو قصير لا يُطابَق", () => {
  assert.equal(matchProduct("", CATALOG).best, null);
  assert.equal(matchProduct("ab", CATALOG).best, null);
});

test("قائمة أصناف فارغة", () => {
  assert.equal(matchProduct("معجون طماطم الكاسر", []).best, null);
});

test("قراءة رديئة جداً لا تُنتج مطابقة واثقة", () => {
  const r = matchProduct("مـ ـعج ون طـ طم لكا سر", CATALOG);
  assert.equal(r.confident, false);
});

test("لبن كامل الدسم لا يُخلط مع قليل الدسم", () => {
  const r = matchProduct("لبن ربيع كامل الدسم ١ لتر", CATALOG);
  assert.equal(r.best.item.barcode, "6281000012345");
});

test("المرشحون مرتبون تنازلياً", () => {
  const r = matchProduct("معجون طماطم الكاسر ٨٠٠ غم", CATALOG);
  for (let i = 1; i < r.candidates.length; i++) {
    assert.ok(r.candidates[i - 1].score >= r.candidates[i].score);
  }
});
