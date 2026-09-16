#!/bin/sh
# بناء PhysicsLab.apk بأدوات أندرويد من مستودعات دبيان/أوبنتو، بلا Gradle
# وبلا تنزيل أي شيء من جوجل:
#   sudo apt-get install -y aapt apksigner zipalign dalvik-exchange \
#                           android-sdk-platform-23 default-jdk
#   ./build.sh
set -e
cd "$(dirname "$0")"

ANDROID_JAR=/usr/lib/android-sdk/platforms/android-23/android.jar
OUT=build
KEYSTORE=physicslab.keystore
KEYALIAS=physicslab
KEYPASS=physicslab

rm -rf "$OUT"; mkdir -p "$OUT/classes" "$OUT/assets"
cp ../index.html "$OUT/assets/index.html"      # المحاكي يُحزم كأصل داخل التطبيق

# ١) جافا ← بايت كود (المستوى ٨ لأن dx لا يفهم ما بعده)
javac -source 8 -target 8 -nowarn -encoding UTF-8 \
      -bootclasspath "$ANDROID_JAR" -classpath "$ANDROID_JAR" \
      -d "$OUT/classes" src/iq/alaboudi/physicslab/*.java 2>&1 | grep -v 'bootstrap class path\|source value 8\|target value 8\|deprecated' || true

# ٢) بايت كود ← dex
dalvik-exchange --dex --output="$OUT/classes.dex" "$OUT/classes"

# ٣) المانيفست والموارد والأصول ← حزمة غير موقّعة
aapt package -f -M AndroidManifest.xml -S res -A "$OUT/assets" \
     -I "$ANDROID_JAR" -F "$OUT/app.unsigned.apk"

# ٤) إضافة classes.dex إلى الحزمة (aapt add يعمل من داخل مجلّد الملف)
( cd "$OUT" && aapt add -f app.unsigned.apk classes.dex >/dev/null )

# ٥) محاذاة ٤ بايت ثم توقيع v1+v2
[ -f "$KEYSTORE" ] || keytool -genkeypair -v -keystore "$KEYSTORE" \
    -alias "$KEYALIAS" -keyalg RSA -keysize 2048 -validity 10950 \
    -storepass "$KEYPASS" -keypass "$KEYPASS" \
    -dname "CN=Ahmed Nema Al-Aboudi, OU=Physics, O=Physics Lab, C=IQ" 2>/dev/null

zipalign -f 4 "$OUT/app.unsigned.apk" "$OUT/app.aligned.apk"
apksigner sign --ks "$KEYSTORE" --ks-key-alias "$KEYALIAS" \
    --ks-pass "pass:$KEYPASS" --key-pass "pass:$KEYPASS" \
    --v1-signing-enabled true --v2-signing-enabled true \
    --out PhysicsLab.apk "$OUT/app.aligned.apk"

rm -rf "$OUT"
ls -l PhysicsLab.apk
