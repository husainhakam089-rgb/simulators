#!/usr/bin/env python3
"""يبني نسخة أندرويد (.apk) لكل تطبيق من نسخته أحادية الملف.

النشاط الوحيد (MainActivity) لا يكرّر منطق التطبيق: هو WebView يحمّل
`assets/app.html` وهو نفس الملف الذي يعمل في المتصفح وفي نسخة ويندوز.

يبقى الحجم صغيراً (~١.٥ ميغابايت) لأن أندرويد فيه محرك عرض جاهز
(System WebView) فلا حاجة لحمل واحد كما في نسخة سطح المكتب.

    python3 android/build-apk.py                 # كل التطبيقات
    python3 android/build-apk.py phy-sixth-5
"""

import os
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
WORK = os.path.join(HERE, 'build')
DIST = os.path.join(HERE, 'dist')

ANDROID_JAR = '/usr/lib/android-sdk/platforms/android-23/android.jar'
DX_JAR = os.path.join(HERE, 'tools', 'dalvik-dx.jar')
KEYSTORE = os.path.join(HERE, 'tools', 'release.keystore')
KS_PASS = 'physixth'

APPS = [
    dict(slug='phy-sixth-1-2', pkg='com.aboudi.physixth12',
         label='مختبر الفيزياء — الفصلان ١ و ٢'),
    dict(slug='phy-sixth-3-4', pkg='com.aboudi.physixth34',
         label='مختبر الفيزياء — الفصلان ٣ و ٤'),
    dict(slug='phy-sixth-5', pkg='com.aboudi.physixth5',
         label='مختبر الفيزياء — الفصل ٥'),
]

MANIFEST = '''<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="{pkg}"
    android:versionCode="1"
    android:versionName="1.0">

    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="34" />
    <application
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:hardwareAccelerated="true"
        android:supportsRtl="true"
        android:allowBackup="false">
        <activity
            android:name="com.aboudi.physixth.MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden|screenLayout"
            android:theme="@android:style/Theme.NoTitleBar">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
'''

STRINGS = '''<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">{label}</string>
</resources>
'''

ICON_DENSITIES = [('mdpi', 48), ('hdpi', 72), ('xhdpi', 96),
                  ('xxhdpi', 144), ('xxxhdpi', 192)]


def run(cmd, **kw):
    subprocess.check_call(cmd, **kw)


def ensure_keystore():
    """مفتاح توقيع واحد لكل التطبيقات، يُولَّد مرة ويُعاد استعماله.

    توقيع التطبيق بنفس المفتاح شرط ليقبل أندرويد تحديثه لاحقاً فوق
    النسخة المثبّتة بدل رفضه."""
    if os.path.exists(KEYSTORE):
        return
    os.makedirs(os.path.dirname(KEYSTORE), exist_ok=True)
    run(['keytool', '-genkeypair', '-v',
         '-keystore', KEYSTORE, '-storepass', KS_PASS, '-keypass', KS_PASS,
         '-alias', 'physixth', '-keyalg', 'RSA', '-keysize', '2048',
         '-validity', '10000',
         '-dname', 'CN=Ahmed Nema Al-Aboudi, OU=Physics, O=Virtual Lab, C=IQ'])


def make_icons(res_dir, logo):
    from PIL import Image
    im = Image.open(logo).convert('RGBA')
    for name, px in ICON_DENSITIES:
        d = os.path.join(res_dir, 'mipmap-' + name)
        os.makedirs(d, exist_ok=True)
        im.resize((px, px), Image.LANCZOS).save(os.path.join(d, 'ic_launcher.png'))


def build(app):
    slug, pkg = app['slug'], app['pkg']
    html = os.path.join(ROOT, slug, slug + '.html')
    if not os.path.exists(html):
        sys.exit('missing %s — run its build-standalone.py first' % html)

    work = os.path.join(WORK, slug)
    shutil.rmtree(work, ignore_errors=True)
    res = os.path.join(work, 'res')
    assets = os.path.join(work, 'assets')
    os.makedirs(os.path.join(res, 'values'))
    os.makedirs(assets)

    shutil.copyfile(html, os.path.join(assets, 'app.html'))
    with open(os.path.join(work, 'AndroidManifest.xml'), 'w') as fh:
        fh.write(MANIFEST.format(pkg=pkg))
    with open(os.path.join(res, 'values', 'strings.xml'), 'w') as fh:
        fh.write(STRINGS.format(label=app['label']))
    make_icons(res, os.path.join(ROOT, slug, 'assets', 'logo.png'))

    # 1) الموارد
    compiled = os.path.join(work, 'res.zip')
    run(['aapt2', 'compile', '--dir', res, '-o', compiled])

    unsigned = os.path.join(work, 'unsigned.apk')
    run(['aapt2', 'link',
         '-I', ANDROID_JAR,
         '--manifest', os.path.join(work, 'AndroidManifest.xml'),
         '-A', assets,
         '-o', unsigned,
         '--min-sdk-version', '21',
         '--target-sdk-version', '34',
         compiled])

    # 2) الشيفرة: java -> class -> dex
    classes = os.path.join(work, 'classes')
    os.makedirs(classes)
    src = os.path.join(HERE, 'src', 'com', 'aboudi', 'physixth', 'MainActivity.java')
    run(['javac', '-source', '8', '-target', '8', '-nowarn',
         '-bootclasspath', ANDROID_JAR, '-classpath', ANDROID_JAR,
         '-d', classes, src])
    run(['java', '-cp', DX_JAR, 'com.android.dx.command.Main',
         '--dex', '--output=' + os.path.join(work, 'classes.dex'), classes])

    # 3) ضمّ classes.dex إلى الحزمة
    run(['zip', '-j', '-q', unsigned, os.path.join(work, 'classes.dex')])

    # 4) محاذاة ثم توقيع (v1+v2+v3 كي يقبله أندرويد الحديث)
    aligned = os.path.join(work, 'aligned.apk')
    run(['zipalign', '-p', '-f', '4', unsigned, aligned])

    os.makedirs(DIST, exist_ok=True)
    out = os.path.join(DIST, slug + '.apk')
    run(['apksigner', 'sign',
         '--ks', KEYSTORE, '--ks-pass', 'pass:' + KS_PASS,
         '--key-pass', 'pass:' + KS_PASS,
         '--v1-signing-enabled', 'true',
         '--v2-signing-enabled', 'true',
         '--v3-signing-enabled', 'true',
         '--out', out, aligned])
    run(['apksigner', 'verify', '--print-certs', out],
        stdout=subprocess.DEVNULL)
    print('    %s  (%.2f MB)' % (out, os.path.getsize(out) / 1048576.0))


def main():
    if not os.path.exists(DX_JAR):
        sys.exit('missing %s — see android/README.md' % DX_JAR)
    ensure_keystore()
    wanted = sys.argv[1:]
    apps = [a for a in APPS if not wanted or a['slug'] in wanted]
    if not apps:
        sys.exit('unknown app; known: %s' % ', '.join(a['slug'] for a in APPS))
    for a in apps:
        print('==> building %s' % a['slug'])
        build(a)


if __name__ == '__main__':
    main()
