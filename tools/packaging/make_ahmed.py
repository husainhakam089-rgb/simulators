# نسخة الدكتور أحمد الحسن من نفس المحاكي: تُبنى من full.html بتبديل الاسم وواجهة البداية فقط
# (الواجهة صورة SVG مرسومة: كتابتها بخطوط الجهاز نفسه فتبقى واضحة بأي حجم شاشة)
import base64, re, sys
src, img, out = sys.argv[1], sys.argv[2], sys.argv[3]
s = open(src, encoding='utf-8').read()
def rep(old, new, cnt=1):
    global s
    n = s.count(old)
    assert n == cnt, (old[:80], n)
    s = s.replace(old, new)
NAME = 'د. أحمد الحسن'
rep('<title>الخلية — محاكي تفاعلي · أحياء السادس العلمي · م. م. أحمد محجوب القيسي</title>',
    f'<title>الخلية — محاكي تفاعلي · أحياء السادس العلمي · {NAME}</title>')
rep('<div class="src"><b>م. م. أحمد محجوب القيسي</b><span>مدرس أحياء · السادس العلمي</span></div>',
    f'<div class="src"><b>{NAME}</b><span>دكتوراه · كلية العلوم · جامعة بغداد</span></div>')
b64 = base64.b64encode(open(img, 'rb').read()).decode()
s, n = re.subn(r'<img id="welImg" alt="[^"]*"\s*src="data:image/jpeg;base64,[^"]*"',
    f'<img id="welImg" alt="الخلية — الدكتور أحمد الحسن، دكتوراه، كلية العلوم، جامعة بغداد، ثانوية الإمام الحسن المجتبى (ع) للمتفوقين — ابدأ المحاكي"\n         src="data:image/svg+xml;base64,{b64}"', s)
assert n == 1
rep('aria-label="ابدأ المحاكاة" title="ابدأ المحاكاة"', 'aria-label="ابدأ المحاكي" title="ابدأ المحاكي"')
# أبعاد الواجهة وموضع زرّ «ابدأ المحاكي» المرسوم عليها
rep('width:min(100vw,75vh);width:min(100vw,calc(100dvh * 896 / 1195));aspect-ratio:896/1195;',
    'width:min(100vw,82vh);width:min(100vw,calc(100dvh * 900 / 1100));aspect-ratio:900/1100;')
rep('box-shadow:0 24px 70px rgba(18,55,36,.35);border-radius:6px;overflow:hidden}',
    'box-shadow:0 24px 70px rgba(0,0,0,.5);border-radius:6px;overflow:hidden}')
rep('.welHot{position:absolute;left:17.4%;top:71.3%;width:62.6%;height:13.4%;',
    '.welHot{position:absolute;left:27.8%;top:89.5%;width:44.4%;height:6.8%;')
rep('@keyframes welPulse{0%,100%{box-shadow:0 0 0 0 rgba(90,170,110,0)}', '@keyframes welPulse{0%,100%{box-shadow:0 0 0 0 rgba(235,195,110,0)}')
rep('50%{box-shadow:0 0 26px 6px rgba(90,170,110,.42)}}', '50%{box-shadow:0 0 26px 6px rgba(235,195,110,.45)}}')
rep('.welHot:hover{background:rgba(255,255,255,.10);box-shadow:0 0 30px 8px rgba(90,170,110,.5)}',
    '.welHot:hover{background:rgba(255,255,255,.08);box-shadow:0 0 30px 8px rgba(235,195,110,.55)}')
rep('.welHot:focus-visible{outline:3px solid #2f6b4a;outline-offset:3px}', '.welHot:focus-visible{outline:3px solid #e8c47a;outline-offset:3px}')
rep('#welcome{position:fixed;inset:0;z-index:60;overflow:hidden;background:#eef2ec;',
    '#welcome{position:fixed;inset:0;z-index:60;overflow:hidden;background:#0f1b2e;')
rep('const WEL = { w: 896, h: 1195, safe: { x0: .03, x1: .95, y0: .11, y1: .97 } };',
    'const WEL = { w: 900, h: 1100, safe: { x0: .04, x1: .96, y0: 0, y1: 1 } };')
open(out, 'w', encoding='utf-8').write(s)
print('ok', len(s))
