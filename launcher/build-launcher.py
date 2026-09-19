#!/usr/bin/env python3
"""يبني مشغّل ويندوز صغيراً (.exe) لكل تطبيق.

بخلاف نسخة `desktop/` التي تحمل محرك Chromium معها (٨٥ ميغابايت)، هذا
المشغّل يدمج ملف التطبيق كمورد ويفتحه بمتصفح الجهاز، فيبقى بحجم التطبيق
نفسه تقريباً (~١.٨ ميغابايت).

    python3 launcher/build-launcher.py
"""

import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DIST = os.path.join(HERE, 'dist')

CC = 'x86_64-w64-mingw32-gcc'
WINDRES = 'x86_64-w64-mingw32-windres'

# اسم المنتج وبياناته على نسق نسخة الصف الثالث المتوسط، مع اسم ملف داخلي
# مميّز لكل تطبيق لأن الجميع يتشاركون مجلد PhysicsLab_AlAboudi.
APPS = [
    dict(slug='phy-sixth-1-2', exe='PhysicsLab_Sixth_1-2',
         product='Virtual Physics Lab', page='sixth-1-2.html',
         title='مختبر الفيزياء الافتراضي — السادس (١ و ٢)',
         desc='Virtual Physics Lab - Grade 12 - Chapters 1 and 2'),
    dict(slug='phy-sixth-3-4', exe='PhysicsLab_Sixth_3-4',
         product='Virtual Physics Lab', page='sixth-3-4.html',
         title='مختبر الفيزياء الافتراضي — السادس (٣ و ٤)',
         desc='Virtual Physics Lab - Grade 12 - Chapters 3 and 4'),
    dict(slug='phy-sixth-5', exe='PhysicsLab_Sixth_5',
         product='Virtual Physics Lab', page='sixth-5.html',
         title='مختبر الفيزياء الافتراضي — السادس (٥)',
         desc='Virtual Physics Lab - Grade 12 - Chapter 5'),
]

RC = '''#include <windows.h>

101 RCDATA "{html}"
1 ICON "{icon}"

VS_VERSION_INFO VERSIONINFO
FILEVERSION 1,0,0,0
PRODUCTVERSION 1,0,0,0
FILEOS VOS__WINDOWS32
FILETYPE VFT_APP
BEGIN
  BLOCK "StringFileInfo"
  BEGIN
    BLOCK "040904B0"
    BEGIN
      VALUE "CompanyName", "Ahmed Ne'ma Al-Aboudi"
      VALUE "FileDescription", "{desc}"
      VALUE "FileVersion", "1.0.0.0"
      VALUE "InternalName", "{slug}"
      VALUE "OriginalFilename", "{slug}.exe"
      VALUE "ProductName", "{product}"
      VALUE "ProductVersion", "1.0.0.0"
      VALUE "LegalCopyright", "Ahmed Ne'ma Al-Aboudi"
    END
  END
  BLOCK "VarFileInfo"
  BEGIN
    VALUE "Translation", 0x409, 1200
  END
END
'''


def build(app):
    slug = app['slug']
    html = os.path.join(ROOT, slug, slug + '.html')
    if not os.path.exists(html):
        sys.exit('missing %s — run its build-standalone.py first' % html)

    icon = os.path.join(ROOT, 'desktop', 'icon.ico')
    name = app['exe']
    rc_path = os.path.join(HERE, '.%s.rc' % slug)
    res_path = os.path.join(HERE, '.%s.res' % slug)
    with open(rc_path, 'w') as fh:
        fh.write(RC.format(html=html.replace('\\', '\\\\'),
                           icon=icon.replace('\\', '\\\\'),
                           slug=name, product=app['product'], desc=app['desc']))

    subprocess.check_call([WINDRES, '-i', rc_path, '-O', 'coff', '-o', res_path])

    os.makedirs(DIST, exist_ok=True)
    out = os.path.join(DIST, name + '.exe')
    subprocess.check_call([
        CC, os.path.join(HERE, 'launcher.c'), res_path,
        '-o', out,
        '-municode',                       # نقطة الدخول wWinMain
        '-mwindows',                       # بلا نافذة طرفية سوداء
        '-O2', '-s',                       # مُحسَّن وبلا رموز تنقيح
        '-DAPP_FOLDER=L"PhysicsLab_AlAboudi"',
        '-DAPP_FILENAME=L"%s"' % app['page'],
        '-DAPP_TITLE=L"%s"' % app['title'],
        '-lshell32', '-lole32', '-luuid',
    ])
    os.remove(rc_path)
    os.remove(res_path)
    print('    %s  (%.2f MB)' % (out, os.path.getsize(out) / 1048576.0))


def main():
    wanted = sys.argv[1:]
    apps = [a for a in APPS if not wanted or a['slug'] in wanted or a['exe'] in wanted]
    if not apps:
        sys.exit('unknown app; known: %s' % ', '.join(a['slug'] for a in APPS))
    for a in apps:
        print('==> building %s' % a['exe'])
        build(a)


if __name__ == '__main__':
    main()
