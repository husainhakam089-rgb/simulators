# نسخة الأستاذ عزالدين عبدالله النعيمي من محاكي الفصل الثالث (التكاثر):
# تُبنى من نسخة الدكتور أحمد الحسن بتبديل الاسم، وواجهة البداية تصير صورة الأستاذ
# (نفس صورة الفصل الأول بعد حذف الأيقونات) وزرّ «ابدأ المحاكاة» المرسوم عليها يعمل.
import base64, re, sys
src, img, out = sys.argv[1], sys.argv[2], sys.argv[3]
s = open(src, encoding='utf-8').read()
def rep(old, new, cnt=1):
    global s
    n = s.count(old)
    assert n == cnt, (old[:80], n)
    s = s.replace(old, new)
NAME = 'الأستاذ عزالدين عبدالله النعيمي'
rep('<title>التكاثر — محاكي تفاعلي · أحياء السادس العلمي · د. أحمد الحسن</title>',
    f'<title>التكاثر — محاكي تفاعلي · أحياء السادس العلمي · {NAME}</title>')
rep('<div class="src"><b>د. أحمد الحسن</b><span>دكتوراه · كلية العلوم · جامعة بغداد</span></div>',
    f'<div class="src"><b>{NAME}</b><span>مدرس أحياء · السادس العلمي</span></div>')
rep('<div class="hintCard">النصوص ورقم الصفحة من ملزمة الدكتور أحمد الحسن للفصل الثالث (المصدر يظهر تحت اسم كل جزء).</div>', '')
rep('والوظيفة وملاحظة مهمة للامتحان — من ملزمة الفصل الثالث.', 'والوظيفة وملاحظة مهمة للامتحان.')

# ── واجهة البداية: الصورة بدل اللوحة ──
b64 = base64.b64encode(open(img, 'rb').read()).decode()
wel = ('<div id="welcome">\n  <div class="welBg"></div>\n  <div class="welStage">\n'
       f'    <img id="welImg" alt="علم الأحياء — {NAME} — ابدأ المحاكاة"\n'
       f'         src="data:image/jpeg;base64,{b64}">\n'
       '    <button id="welGo" class="welHot" aria-label="ابدأ المحاكاة" title="ابدأ المحاكاة"></button>\n'
       '  </div>\n'
       '  <button id="welExam" class="btn3d ghost3d welExam">وضع الامتحان</button>\n'
       '  <button id="welDraw" class="btn3d ghost3d welExam welDraw">الرسم اليدوي</button>\n'
       '</div>\n\n')
s, n = re.subn(r'<div id="welcome">.*?(?=<header id="top">)', lambda m: wel, s, count=1, flags=re.S)
assert n == 1
# لوحة الفصل الثاني الداكنة كانت تجعل #welcome مرناً بحشوة؛ الصورة تتموضع بنفسها
rep('#welcome{display:flex;align-items:center;justify-content:center;padding:14px;',
    '#welcome{')
# أبعاد الصورة وموضع زرّ «ابدأ المحاكاة» المرسوم عليها (مثل الفصل الأول)
rep('width:min(100vw,75vh);width:min(100vw,calc(100dvh * 896 / 1195));aspect-ratio:896/1195;',
    'width:min(100vw,98vh);width:min(100vw,calc(100dvh * 1024 / 1036));aspect-ratio:1024/1036;')
rep('box-shadow:0 24px 70px rgba(18,55,36,.35);border-radius:6px;overflow:hidden}',
    'box-shadow:0 24px 70px rgba(0,0,0,.5);border-radius:6px;overflow:hidden}')
rep('.welHot{position:absolute;left:17.4%;top:71.3%;width:62.6%;height:13.4%;\n    border:0;border-radius:999px;',
    '.welHot{position:absolute;left:27.3%;top:88.7%;width:45.4%;height:10.2%;\n    border:0;border-radius:12px;')
rep('@keyframes welPulse{0%,100%{box-shadow:0 0 0 0 rgba(90,170,110,0)}', '@keyframes welPulse{0%,100%{box-shadow:0 0 0 0 rgba(235,195,110,0)}')
rep('50%{box-shadow:0 0 26px 6px rgba(90,170,110,.42)}}', '50%{box-shadow:0 0 26px 6px rgba(235,195,110,.45)}}')
rep('.welHot:hover{background:rgba(255,255,255,.10);box-shadow:0 0 30px 8px rgba(90,170,110,.5)}',
    '.welHot:hover{background:rgba(255,255,255,.08);box-shadow:0 0 30px 8px rgba(235,195,110,.55)}')
rep('.welHot:focus-visible{outline:3px solid #2f6b4a;outline-offset:3px}', '.welHot:focus-visible{outline:3px solid #e8c47a;outline-offset:3px}')
# الخلفية المغبّشة من الصورة نفسها، والمنطقة المهمة التي تبقى ظاهرة عند ملء الشاشة
rep('/* الخلفية المغبّشة من الصورة نفسها (بلا تكرار الصورة داخل الملف) */\n',
    "/* الخلفية المغبّشة من الصورة نفسها (بلا تكرار الصورة داخل الملف) */\n$('.welBg').style.backgroundImage = 'url(' + $('#welImg').src + ')';\n")
rep('const WEL = { w: 896, h: 1195, safe: { x0: .03, x1: .95, y0: .11, y1: .97 } };',
    'const WEL = { w: 1024, h: 1036, safe: { x0: .1, x1: .9, y0: 0, y1: 1 } };')
# ── نسخة للطلاب بدل الملزمة: تنشال كل الإشارات للملزمة وأرقام صفحاتها ──
s = s.replace(' (كما في الملزمة)', '')
PG = r'ص\s?\d+(?:–\d+)?'
PGS = PG + r'(?:\s*(?:و|،)\s*' + PG + r')*'
s = re.sub(r"'ملزمة " + PGS + r"'", "''", s)                          # src: 'ملزمة ص12'
s = re.sub(r"'ملزمة " + PGS + r" \((وزاري)\)'", r"'(\1)'", s)
s = re.sub(r'\s*\((?:ملزمة )?' + PGS + r'\)', '', s)                  # «… (ملزمة ص12).» و«(ص12)»
s = re.sub(r'\s*\((?:ملزمة )?' + PGS + r' (وزاري)\)', r' (\1)', s)
s = re.sub(r'\s*—\s*ملزمة ' + PGS, '', s)                              # «… — ملزمة ص12»
s = re.sub(r'\s*·\s*ملزمة ' + PGS, '', s)
for a, b in [('تأشيرات رسم الملزمة', 'تأشيرات الرسم'), ('تأشير في رسم الملزمة', 'تأشير في الرسم'),
             ('جداول الملزمة', 'جداول الفصل'), ('رسوم الملزمة', 'الرسوم'), ('رسم الملزمة', 'الرسم'),
             ('خطوات الملزمة', 'الخطوات'), ('كما في الملزمة', '')]:
    s = s.replace(a, b)
# ── صيغ الفصل الثالث الإضافية ──
PG3 = r'ص\s?\d+(?:[–-]\d+)?'
PGS3 = PG3 + r'(?:\s*(?:و|،)\s*' + PG3 + r')*'
PRE = r'(?:ملزمة |جدول |شكل |مراجعة |من نص الملزمة )?'
# «(جدول ص35)» «(شكل ص107)» «(ملزمة ص36، وزاري 20/1)» ← يبقى «(وزاري 20/1)» فقط
s = re.sub(r'\s*\(' + PRE + PGS3 + r'(?:\s*،\s*(وزاري[^)]*))?\)', lambda m: ' (' + m.group(1) + ')' if m.group(1) else '', s)
s = re.sub(r"'(?:ملزمة )?" + PGS3 + r"\.?'", "''", s)                     # 'ص82–86' و'ملزمة ص97.'
s = re.sub(r'ملزمة ' + PGS3 + r' (شكل [\d-]+)', r'\1', s)                 # «ملزمة ص77 شكل 3-19»
s = re.sub(r"'ملزمة " + PGS3 + r" — ", "'", s)                          # «ملزمة ص96 — علل: …»
s = re.sub(r'\s*—\s*(?:من نص الملزمة|جدول) ' + PGS3, '', s)               # «… — جدول ص50» «— من نص الملزمة ص48–50»
s = re.sub(r'جدول ' + PG3 + r':\s*', '', s)                               # «جدول ص121: …»
s = re.sub(r'(علل) ' + PG3 + r':', r'\1:', s)                              # «علل ص38:»
s = re.sub(r'\s*—\s*امتحان التكاثر [^\'"`<(]*' + PG3 + r'\s*\(الأجوبة من نص الملزمة ' + PGS3 + r'\)', '', s)
s = re.sub(r'\s*—\s*من أسئلة الملزمة ' + PGS3, '', s)
s = re.sub(r'(احتياطاً)،?\s*' + PG3, r'\1', s)
s = re.sub(r'(ارسم مع التأشير)\s*' + PG3, r'\1', s)
s = re.sub(r'\s*\(الإنفوغرافيك ' + PG3 + r'\)', '', s)
for a, b in [('لتظهر معلوماته من الملزمة.', 'لتظهر معلوماته.'), (' (أرقام الأيام مصححة؛ طُبعت معكوسة في الملزمة)', '')]:
    assert a in s, a
    s = s.replace(a, b)
open(out, 'w', encoding='utf-8').write(s)
