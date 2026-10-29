# نسخة الأستاذ عزالدين النعيمي من نفس المحاكي: تُبنى من full.html بتبديل الاسم وصورة الواجهة فقط
import base64, re, sys
src, img, out = sys.argv[1], sys.argv[2], sys.argv[3]
s = open(src, encoding='utf-8').read()
def rep(old, new, cnt=1):
    global s
    n = s.count(old)
    assert n == cnt, (old[:80], n)
    s = s.replace(old, new)
NAME = 'الأستاذ عزالدين النعيمي'
rep('<title>الخلية — محاكي تفاعلي · أحياء السادس العلمي · م. م. أحمد محجوب القيسي</title>',
    f'<title>الخلية — محاكي تفاعلي · أحياء السادس العلمي · {NAME}</title>')
rep('<div class="src"><b>م. م. أحمد محجوب القيسي</b><span>مدرس أحياء · السادس العلمي</span></div>',
    f'<div class="src"><b>{NAME}</b><span>مدرس أحياء · السادس العلمي</span></div>')
b64 = base64.b64encode(open(img, 'rb').read()).decode()
s, n = re.subn(r'<img id="welImg" alt="[^"]*"\s*src="data:image/jpeg;base64,[^"]*"',
    f'<img id="welImg" alt="علم الأحياء — {NAME} — ابدأ المحاكاة"\n         src="data:image/jpeg;base64,{b64}"', s)
assert n == 1
# أبعاد الصورة الجديدة وموضع زرّ «ابدأ المحاكاة» المرسوم عليها (مستطيل مدوّر الحواف)
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
rep('#welcome{position:fixed;inset:0;z-index:60;overflow:hidden;background:#eef2ec;',
    '#welcome{position:fixed;inset:0;z-index:60;overflow:hidden;background:#15233a;')
# المنطقة المهمة في الصورة: العنوان وصورة الأستاذ واسمه والزر (تبقى ظاهرة عند تكبيرها لتملأ الشاشة)
rep('const WEL = { w: 896, h: 1195, safe: { x0: .03, x1: .95, y0: .11, y1: .97 } };',
    'const WEL = { w: 1024, h: 1036, safe: { x0: .1, x1: .9, y0: 0, y1: 1 } };')
open(out, 'w', encoding='utf-8').write(s)
print('ok', len(s))
