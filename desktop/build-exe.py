#!/usr/bin/env python3
"""يبني نسخة ويندوز (.exe) لكل تطبيق من نسخته أحادية الملف.

الغلاف هنا (main.js) لا يكرّر منطق التطبيق: هو نافذة Electron تحمّل نفس
ملف `<app>.html` الذي يعمل في المتصفح، فيبقى مصدر الحقيقة واحداً — أي
تعديل على التطبيق يصل إلى نسخة الـ exe بمجرد إعادة البناء.

    python3 desktop/build-exe.py            # التطبيقان
    python3 desktop/build-exe.py phy-sixth-1-2
"""

import json
import os
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DIST = os.path.join(HERE, 'dist')

APPS = [
    dict(slug='phy-sixth-1-2',
         product='Phy Sixth 1-2',
         appId='com.aboudi.physixth12'),
    dict(slug='phy-sixth-3-4',
         product='Phy Sixth 3-4',
         appId='com.aboudi.physixth34'),
    dict(slug='phy-sixth-5',
         product='Phy Sixth 5',
         appId='com.aboudi.physixth5'),
]


def build(app):
    src = os.path.join(ROOT, app['slug'], app['slug'] + '.html')
    if not os.path.exists(src):
        sys.exit('missing %s — run its build-standalone.py first' % src)
    shutil.copyfile(src, os.path.join(HERE, 'app.html'))

    config = {
        'appId': app['appId'],
        'productName': app['product'],
        'directories': {'output': 'dist'},
        'files': ['main.js', 'app.html', 'icon.png'],
        'compression': 'maximum',
        'win': {
            'target': ['portable'],
            'icon': 'icon.ico',
            'artifactName': app['slug'] + '.exe',
        },
        # ملف واحد يعمل بالنقر المزدوج بلا تثبيت، كنسخة الويب تماماً
        'portable': {'artifactName': app['slug'] + '.exe'},
    }
    cfg_path = os.path.join(HERE, '.builder-%s.json' % app['slug'])
    with open(cfg_path, 'w') as fh:
        json.dump(config, fh, indent=2)

    print('==> building %s' % app['product'])
    subprocess.check_call(
        [os.path.join(HERE, 'node_modules', '.bin', 'electron-builder'),
         '--win', 'portable', '--x64', '--config', cfg_path],
        cwd=HERE,
    )
    os.remove(cfg_path)

    out = os.path.join(DIST, app['slug'] + '.exe')
    if os.path.exists(out):
        print('    %s  (%.1f MB)' % (out, os.path.getsize(out) / 1048576.0))
    else:
        sys.exit('build finished but %s is missing' % out)


def main():
    wanted = sys.argv[1:]
    apps = [a for a in APPS if not wanted or a['slug'] in wanted]
    if not apps:
        sys.exit('unknown app; known: %s' % ', '.join(a['slug'] for a in APPS))
    for a in apps:
        build(a)


if __name__ == '__main__':
    main()
