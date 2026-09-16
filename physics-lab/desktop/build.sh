#!/bin/sh
# بناء PhysicsLab.exe — تصريف متقاطع من لينكس بـ mingw-w64.
#   sudo apt-get install -y mingw-w64
#   ./build.sh
# الناتج: PhysicsLab.exe — ملف واحد يحمل المحاكي وصورته وأيقونته.
set -e
cd "$(dirname "$0")"

cp -f ../index.html ./index.html          # المورد يُقرأ من مجلّد البناء

x86_64-w64-mingw32-windres app.rc -O coff -o app.res
x86_64-w64-mingw32-gcc -O2 -municode -mwindows -s \
    launcher.c app.res -o PhysicsLab.exe \
    -lshell32 -ladvapi32 -lole32

rm -f app.res index.html
ls -l PhysicsLab.exe
