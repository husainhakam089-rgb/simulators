# نسخة الأستاذ عزالدين عبدالله النعيمي من محاكي الفصل الثاني (الأنسجة):
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
rep('<title>الأنسجة — محاكي تفاعلي · أحياء السادس العلمي · د. أحمد الحسن</title>',
    f'<title>الأنسجة — محاكي تفاعلي · أحياء السادس العلمي · {NAME}</title>')
rep('<div class="src"><b>د. أحمد الحسن</b><span>دكتوراه · كلية العلوم · جامعة بغداد</span></div>',
    f'<div class="src"><b>{NAME}</b><span>مدرس أحياء · السادس العلمي</span></div>')
rep('النصوص ورقم الصفحة من ملزمة الدكتور أحمد الحسن للفصل الثاني',
    'النصوص ورقم الصفحة من ملزمة الفصل الثاني')

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
open(out, 'w', encoding='utf-8').write(s)
print('ok', len(s))
