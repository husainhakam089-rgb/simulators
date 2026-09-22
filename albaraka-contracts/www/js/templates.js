/* قوالب الطباعة: العقد على A4 كامل، والوصل على نصف A4 */
const Templates = (() => {
  const e = U.escapeHtml;

  const COPY_LABELS = { seller: 'نسخة البائع', buyer: 'نسخة المشتري', shop: 'نسخة المعرض' };

  /* نقاط التنقيط كما في الدفتر الورقي: القيمة تنزل مكان النقاط */
  const fill = (value, { cls = '' } = {}) =>
    `<span class="fill ${cls}">${value ? e(value) : ''}</span>`;

  /* المبلغ: رقماً وكتابةً، ويبقى السطر فارغاً إذا لم يُدخَل مبلغ */
  const money = (value, words) => {
    const n = U.num(value);
    if (!n) return '';
    return words ? `${U.fmtMoney(n)}  (${words})` : U.fmtMoney(n);
  };

  const head = (s, copyKind, docNo, docTitle) => `
  <header class="head">
    <div class="head-side right">
      ${s.images?.headerRight ? `<img src="${s.images.headerRight}" alt="">` : '<div class="img-slot">صورة الترتكتر</div>'}
    </div>
    <div class="head-center">
      ${s.images?.logo ? `<img class="logo" src="${s.images.logo}" alt="">` : '<div class="img-slot logo-slot">الشعار</div>'}
      <h1>${e(s.shopName)}</h1>
      <div class="head-meta">الإدارة: ${e(s.manager)}</div>
      <div class="head-meta">${e(s.address)}${s.phone ? ` — ${e(s.phone)}` : ''}</div>
    </div>
    <div class="head-side left">
      ${s.images?.headerLeft ? `<img src="${s.images.headerLeft}" alt="">` : '<div class="img-slot">صورة السيارة</div>'}
    </div>
    <div class="doc-no">${docTitle} رقم <b>${e(U.docNo(docNo))}</b></div>
    ${copyKind ? `<div class="copy-tag">${e(COPY_LABELS[copyKind] || '')}</div>` : ''}
  </header>`;

  const personBlock = (title, p = {}) => `
  <div class="party">
    <h3>${title}</h3>
    <div class="row"><label>الاسم</label>${fill(p.name)}</div>
    <div class="row"><label>نوع الهوية</label>${fill(p.idType)}</div>
    ${p.idType === 'هوية أحوال قديمة'
      ? `<div class="row two"><span><label>السجل</label>${fill(p.recordNo)}</span><span><label>الصفحة</label>${fill(p.pageNo)}</span></div>`
      : `<div class="row"><label>رقم البطاقة</label>${fill(p.idNumber)}</div>`}
    <div class="row"><label>الدائرة</label>${fill(p.office)}</div>
    <div class="row"><label>العنوان</label>${fill(p.address)}</div>
    <div class="row"><label>الموبايل</label>${fill(p.mobile, { cls: 'ltr' })}</div>
  </div>`;

  /* صفحة عقد كاملة */
  function contractPage(c, s, copyKind) {
    const m = c.machine || {};
    const photos = c.photos || {};
    const plate = m.plate ? [m.plate, m.plateProvince].filter(Boolean).join(' / ') : '';
    return `
<section class="page contract">
  <div class="frame">
    ${head(s, copyKind, c.no, 'عقد بيع')}

    <div class="photos">
      <div class="photo-cell">
        <span class="photo-cap">المشتري</span>
        ${photos.buyer ? `<img src="${photos.buyer}" alt="">` : ''}
      </div>
      <div class="title-wrap"><h2 class="doc-title">عقد بيع</h2></div>
      <div class="photo-cell">
        <span class="photo-cap">البائع</span>
        ${photos.seller ? `<img src="${photos.seller}" alt="">` : ''}
      </div>
    </div>

    <div class="dateline">
      <span>اليوم: ${fill(U.dayName(c.datetime))}</span>
      <span>الموافق: ${fill(U.fmtDate(c.datetime))}</span>
      <span>الساعة: ${fill(U.fmtTime(c.datetime))}</span>
    </div>

    <p class="intro">
      اتفق الطرفان على بيع وشراء الآلية الموصوفة أدناه، وقد جرى البيع برضا الطرفين وبحضور الشهود:
    </p>

    <div class="grid machine">
      <div class="row"><label>نوع الآلية</label>${fill(m.type)}</div>
      <div class="row"><label>الماركة</label>${fill(m.brand)}</div>
      <div class="row"><label>الموديل</label>${fill(m.model, { cls: 'ltr' })}</div>
      <div class="row"><label>اللون</label>${fill(m.color)}</div>
      <div class="row wide"><label>رقم الشاصي</label>${fill(m.chassis, { cls: 'ltr' })}</div>
      <div class="row wide"><label>رقم المحرك</label>${fill(m.engine, { cls: 'ltr' })}</div>
      <div class="row wide"><label>المرقمة</label>${fill(plate, { cls: 'ltr' })}</div>
    </div>

    <div class="grid annual">
      <div class="row"><label>السنوية بأسم</label>${fill(c.annual?.name)}</div>
      <div class="row"><label>عنوانه</label>${fill(c.annual?.address)}</div>
    </div>

    <div class="amounts">
      <div class="row wide"><label>المبلغ</label>${fill(money(c.amount, c.amountWords))}</div>
      <div class="row"><label>وقد قبض منه</label>${fill(money(c.paid))}</div>
      <div class="row"><label>والباقي</label>${fill(money(c.remaining))}</div>
    </div>

    <div class="row notes"><label>الملاحظات</label>${fill(c.notes)}</div>

    <div class="parties">
      ${personBlock('بيانات البائع', c.seller)}
      ${personBlock('بيانات المشتري', c.buyer)}
    </div>

    <ol class="terms">
      ${(s.terms || []).map((t) => `<li>${e(t)}</li>`).join('')}
    </ol>

    <div class="signs">
      <div><span class="sign-line"></span>البائع</div>
      <div><span class="sign-line"></span>الشاهد الأول</div>
      <div><span class="sign-line"></span>الشرعي</div>
      <div><span class="sign-line"></span>الشاهد الثاني</div>
      <div><span class="sign-line"></span>المشتري</div>
    </div>
  </div>
</section>`;
  }

  /* وصل صغير: نصف ورقة A4 */
  function receiptSlip(r, s, copyKind) {
    return `
<div class="slip">
  <div class="frame">
    ${head(s, copyKind, r.no, 'وصل')}
    <div class="dateline">
      <span>اليوم: ${fill(U.dayName(r.datetime))}</span>
      <span>الموافق: ${fill(U.fmtDate(r.datetime))}</span>
      <span>الساعة: ${fill(U.fmtTime(r.datetime))}</span>
    </div>
    <div class="grid">
      <div class="row wide"><label>استلمت من السيد</label>${fill(r.buyerName)}</div>
      <div class="row"><label>نوع الأداة</label>${fill(r.tool)}</div>
      <div class="row"><label>العدد</label>${fill(r.qty)}</div>
      <div class="row wide"><label>المبلغ</label>${fill(money(r.amount, r.amountWords))}</div>
      <div class="row"><label>وقد قبض منه</label>${fill(money(r.paid))}</div>
      <div class="row"><label>والباقي</label>${fill(money(r.remaining))}</div>
      <div class="row wide"><label>الموبايل</label>${fill(r.mobile, { cls: 'ltr' })}</div>
      <div class="row wide"><label>الملاحظات</label>${fill(r.notes)}</div>
    </div>
    <div class="signs two">
      <div><span class="sign-line"></span>المستلم</div>
      <div><span class="sign-line"></span>المعرض</div>
    </div>
  </div>
</div>`;
  }

  /* ورقة وصولات: وصل واحد أو وصلان مع خط قص بينهما */
  function receiptPage(slipsHtml) {
    const [a, b] = slipsHtml;
    return `
<section class="page receipts">
  ${a || ''}
  <div class="cut-line"><span>✂ قص هنا</span></div>
  ${b || '<div class="slip empty"></div>'}
</section>`;
  }

  return { contractPage, receiptSlip, receiptPage, COPY_LABELS };
})();
