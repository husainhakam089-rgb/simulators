# نسخة الأستاذ عز الدين عبدالله من محاكي الفصل الثاني (الأنسجة):
# تُبنى من نسخة الدكتور أحمد الحسن بتبديل الاسم فقط (نفس المحتوى والواجهة والرسوم)
import sys
src, out = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()
def rep(old, new, cnt=1):
    global s
    n = s.count(old)
    assert n == cnt, (old[:80], n)
    s = s.replace(old, new)
NAME = 'الأستاذ عز الدين عبدالله'
rep('<title>الأنسجة — محاكي تفاعلي · أحياء السادس العلمي · د. أحمد الحسن</title>',
    f'<title>الأنسجة — محاكي تفاعلي · أحياء السادس العلمي · {NAME}</title>')
rep('<div class="welName"><b>الدكتور أحمد الحسن</b><span>دكتوراه · كلية العلوم · جامعة بغداد</span>'
    '<span>ثانوية الإمام الحسن المجتبى (ع) للمتفوقين</span></div>',
    f'<div class="welName"><b>{NAME}</b></div>')
rep('<div class="src"><b>د. أحمد الحسن</b><span>دكتوراه · كلية العلوم · جامعة بغداد</span></div>',
    f'<div class="src"><b>{NAME}</b></div>')
rep('النصوص ورقم الصفحة من ملزمة الدكتور أحمد الحسن للفصل الثاني',
    'النصوص ورقم الصفحة من ملزمة الفصل الثاني')
open(out, 'w', encoding='utf-8').write(s)
print('ok', len(s))
