/* إرسال ملف PDF مباشرة إلى طابعة الشبكة عبر بروتوكول IPP.
   تُستعمل بعد ضبط عنوان الطابعة في الإعدادات، وتبقى الطريقة الأولى بديلاً جاهزاً. */
const IPP = (() => {
  const TAGS = {
    operation: 0x01, job: 0x02, end: 0x03,
    charset: 0x47, naturalLanguage: 0x48, uri: 0x45,
    nameWithoutLanguage: 0x42, keyword: 0x44, integer: 0x21, mimeMediaType: 0x49,
  };
  const OP_PRINT_JOB = 0x0002;

  class Writer {
    constructor() { this.bytes = []; }
    u8(v) { this.bytes.push(v & 0xff); return this; }
    u16(v) { this.bytes.push((v >> 8) & 0xff, v & 0xff); return this; }
    u32(v) { this.bytes.push((v >>> 24) & 0xff, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff); return this; }
    str(s) {
      const enc = new TextEncoder().encode(s);
      this.u16(enc.length);
      for (const b of enc) this.bytes.push(b);
      return this;
    }
    attr(tag, name, value) {
      this.u8(tag).str(name);
      if (tag === TAGS.integer) { this.u16(4); this.u32(value); }
      else this.str(String(value));
      return this;
    }
    bytesArray() { return Uint8Array.from(this.bytes); }
  }

  /* ipp://host:631/path  →  http://host:631/path */
  function httpUrl(printerUrl) {
    const url = String(printerUrl).trim();
    if (/^https?:\/\//i.test(url)) return url;
    if (/^ipps:\/\//i.test(url)) return url.replace(/^ipps:\/\//i, 'https://');
    if (/^ipp:\/\//i.test(url)) return url.replace(/^ipp:\/\//i, 'http://');
    /* عنوان IP مجرّد: المسار الافتراضي لطابعات Epson */
    return `http://${url.replace(/\/+$/, '')}:631/ipp/print`;
  }

  function ippUri(printerUrl) {
    const url = String(printerUrl).trim();
    if (/^ipps?:\/\//i.test(url)) return url;
    if (/^https?:\/\//i.test(url)) return url.replace(/^https?/i, (m) => (m.toLowerCase() === 'https' ? 'ipps' : 'ipp'));
    return `ipp://${url.replace(/\/+$/, '')}:631/ipp/print`;
  }

  function buildPrintJob({ printerUrl, jobName, copies = 1, user = 'albaraka' }) {
    const w = new Writer();
    w.u16(0x0200);          // IPP 2.0
    w.u16(OP_PRINT_JOB);
    w.u32(1);               // request-id
    w.u8(TAGS.operation);
    w.attr(TAGS.charset, 'attributes-charset', 'utf-8');
    w.attr(TAGS.naturalLanguage, 'attributes-natural-language', 'ar');
    w.attr(TAGS.uri, 'printer-uri', ippUri(printerUrl));
    w.attr(TAGS.nameWithoutLanguage, 'requesting-user-name', user);
    w.attr(TAGS.nameWithoutLanguage, 'job-name', jobName || 'document');
    w.attr(TAGS.mimeMediaType, 'document-format', 'application/pdf');
    w.u8(TAGS.job);
    w.attr(TAGS.integer, 'copies', Math.max(1, Number(copies) || 1));
    w.attr(TAGS.keyword, 'media', 'iso_a4_210x297mm');
    w.attr(TAGS.keyword, 'sides', 'one-sided');
    w.u8(TAGS.end);
    return w.bytesArray();
  }

  function concat(a, b) {
    const out = new Uint8Array(a.length + b.length);
    out.set(a, 0); out.set(b, a.length);
    return out;
  }

  function base64ToBytes(base64) {
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  /* قراءة حالة العملية من رد الطابعة */
  function readStatus(buf) {
    const view = new DataView(buf);
    if (buf.byteLength < 8) throw new Error('رد غير مفهوم من الطابعة');
    const code = view.getUint16(2);
    return { code, ok: code < 0x0100 };
  }

  async function printPdf({ printerUrl, base64, jobName = 'document', copies = 1 }) {
    const header = buildPrintJob({ printerUrl, jobName, copies });
    const body = concat(header, base64ToBytes(base64));
    const res = await fetch(httpUrl(printerUrl), {
      method: 'POST',
      headers: { 'Content-Type': 'application/ipp' },
      body,
    });
    if (!res.ok) throw new Error(`الطابعة ردّت بالحالة ${res.status}`);
    const status = readStatus(await res.arrayBuffer());
    if (!status.ok) throw new Error(`الطابعة رفضت الطلب (رمز ${status.code.toString(16)})`);
    return status;
  }

  /* فحص سريع للاتصال قبل اعتماد الطباعة المباشرة */
  async function probe(printerUrl) {
    const res = await fetch(httpUrl(printerUrl), { method: 'OPTIONS' }).catch(() => null);
    return !!res;
  }

  return { printPdf, probe, httpUrl, ippUri };
})();
