# بناء تطبيقي «الخلية» (أندرويد وويندوز)

بأدوات محلية فقط (Python + Pillow، JDK، Go، Chromium/Playwright للأيقونة):

1. الأيقونة: `node icon.mjs $PWD/icon.html $PWD/icon512.png` ثم تصغيرها إلى 256.
2. نسخة الأستاذ: `python3 make_sajjad.py biology-cell/index.html الأستاذ-سجاد/poster-source.jpg الأستاذ-سجاد/الفصل-الأول-الأستاذ-سجاد.html`.
   (مجلد كل أستاذ وملفاته باسمه: `الأستاذ-سجاد/`، `الأستاذ-النعيمي/`، `الدكتور-أحمد-الحسن/`.)
3. APK: `keytool -genkeypair -keystore cell.jks -alias cell ...` مرة واحدة (احتفظ بالمفتاح
   نفسه للتحديثات)، ثم `python3 apkbuild.py <index.html> <icon256.png> <out.apk> cell.jks <pass>`.
4. EXE: انسخ `index.html` إلى `exe/`، ثم `python3 gen_syso.py <icon512.png> rsrc_windows_amd64.syso`
   و`GOOS=windows GOARCH=amd64 go build -ldflags "-H=windowsgui -s -w" -o الخلية.exe .`
5. نسخة أستاذ آخر: `make_naimi.py` مثل `make_sajjad.py`. لكل نسخة معرّف APK خاص
   (`APK_PKG=com.naimi.cell`) ومفتاح توقيع خاص، ومجلد حفظ خاص للـ EXE
   (`-ldflags "... -X main.appDir=AlKhaliaNaimi"`).

6. نسخة الدكتور أحمد الحسن تُبنى من مصدرها الخاص `ahmed/base-ch1.html` (فيه تعديلاته على الانقسام الخيطي فقط)،
   لا من `biology-cell/index.html`: `python3 make_ahmed.py ahmed/base-ch1.html <poster.svg> <out.html>`.
7. اسم تطبيق أندرويد: `APK_LABEL` (الافتراضي «الخلية»). الفصل الثاني للدكتور أحمد:
   `APK_PKG=com.ahmed.tissues APK_LABEL=الأنسجة python3 apkbuild.py ...` بأيقونة `icon-tissues.html`،
   والفصل الأول `APK_PKG=com.ahmed.cell`. مجلدا حفظ الـ EXE: `AlKhaliaAhmed` و`AlAnsijaAhmed`.
8. الفصل الثاني للأستاذ عزالدين عبدالله النعيمي يُبنى من نسخة الدكتور أحمد بتبديل الاسم وواجهة الصورة
   (`الأستاذ-النعيمي/poster-source.jpg`، زرّ «ابدأ المحاكاة» المرسوم عليها يعمل):
   `python3 make_naimi_ch2.py <الفصل-الثاني-الدكتور-أحمد-الحسن.html> الأستاذ-النعيمي/poster-source.jpg <out.html>`، ثم
   `APK_PKG=com.naimi.tissues APK_LABEL=الأنسجة` بنفس مفتاح الأستاذ النعيمي، ومجلد حفظ الـ EXE `AlAnsijaNaimi`.
