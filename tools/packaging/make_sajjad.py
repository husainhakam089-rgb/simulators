# نسخة الأستاذ سجاد سالم العزاوي من نفس المحاكي: تُبنى من full.html بتبديل الاسم وصورة الواجهة فقط
import base64, re, sys
src, img, out = sys.argv[1], sys.argv[2], sys.argv[3]
s = open(src, encoding='utf-8').read()
def rep(old, new, cnt=1):
    global s
    n = s.count(old)
    assert n == cnt, (old[:80], n)
    s = s.replace(old, new)
NAME = 'الأستاذ سجاد سالم العزاوي'
rep('<title>الخلية — محاكي تفاعلي · أحياء السادس العلمي · م. م. أحمد محجوب القيسي</title>',
    f'<title>الخلية — محاكي تفاعلي · أحياء السادس العلمي · {NAME}</title>')
rep('<div class="src"><b>م. م. أحمد محجوب القيسي</b><span>مدرس أحياء · السادس العلمي</span></div>',
    f'<div class="src"><b>{NAME}</b><span>ماجستير علم الأحياء · ثانوية شط العرب للمتفوقين</span></div>')
b64 = base64.b64encode(open(img, 'rb').read()).decode()
s, n = re.subn(r'<img id="welImg" alt="[^"]*"\s*src="data:image/jpeg;base64,[^"]*"',
    f'<img id="welImg" alt="{NAME} — ماجستير في علم الأحياء، مدرس في ثانوية شط العرب للمتفوقين — ابدأ المحاكي"\n         src="data:image/jpeg;base64,{b64}"', s)
assert n == 1
rep('aria-label="ابدأ المحاكاة" title="ابدأ المحاكاة"', 'aria-label="ابدأ المحاكي" title="ابدأ المحاكي"')
# أبعاد الصورة الجديدة وموضع زرّ «ابدأ المحاكي» المرسوم عليها
rep('width:min(100vw,75vh);width:min(100vw,calc(100dvh * 896 / 1195));aspect-ratio:896/1195;',
    'width:min(100vw,88vh);width:min(100vw,calc(100dvh * 931 / 1052));aspect-ratio:931/1052;')
rep('.welHot{position:absolute;left:17.4%;top:71.3%;width:62.6%;height:13.4%;',
    '.welHot{position:absolute;left:27.2%;top:89%;width:48.2%;height:9.2%;')
rep('50%{box-shadow:0 0 26px 6px rgba(90,170,110,.42)}}', '50%{box-shadow:0 0 26px 6px rgba(60,170,180,.5)}}')
rep('.welHot:hover{background:rgba(255,255,255,.10);box-shadow:0 0 30px 8px rgba(90,170,110,.5)}',
    '.welHot:hover{background:rgba(255,255,255,.12);box-shadow:0 0 30px 8px rgba(60,170,180,.55)}')
rep('#welcome{position:fixed;inset:0;z-index:60;overflow:hidden;background:#eef2ec;',
    '#welcome{position:fixed;inset:0;z-index:60;overflow:hidden;background:#cfe3ee;')
# المنطقة المهمة في الصورة: الشعار والاسم والزر (تبقى ظاهرة عند تكبيرها لتملأ الشاشة)
rep('const WEL = { w: 896, h: 1195, safe: { x0: .03, x1: .95, y0: .11, y1: .97 } };',
    'const WEL = { w: 931, h: 1052, safe: { x0: .08, x1: .93, y0: .2, y1: .985 } };')
open(out, 'w', encoding='utf-8').write(s)
print('ok', len(s))
