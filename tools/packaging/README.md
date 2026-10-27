# بناء تطبيقي «الخلية» (أندرويد وويندوز)

بأدوات محلية فقط (Python + Pillow، JDK، Go، Chromium/Playwright للأيقونة):

1. الأيقونة: `node icon.mjs $PWD/icon.html $PWD/icon512.png` ثم تصغيرها إلى 256.
2. نسخة الأستاذ: `python3 make_sajjad.py <full.html> <poster.jpg> <out/index.html>`.
3. APK: `keytool -genkeypair -keystore cell.jks -alias cell ...` مرة واحدة (احتفظ بالمفتاح
   نفسه للتحديثات)، ثم `python3 apkbuild.py <index.html> <icon256.png> <out.apk> cell.jks <pass>`.
4. EXE: انسخ `index.html` إلى `exe/`، ثم `python3 gen_syso.py <icon512.png> rsrc_windows_amd64.syso`
   و`GOOS=windows GOARCH=amd64 go build -ldflags "-H=windowsgui -s -w" -o الخلية.exe .`
