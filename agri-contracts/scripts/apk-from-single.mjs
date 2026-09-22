#!/usr/bin/env node
// يضع نسخة «الملف الواحد» داخل مشروع أندرويد بدل ملفات www/.
// يُستعمل إذا عُدّل الملف الواحد مباشرة ويُراد إخراج APK منه.

import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const single = join(root, 'عقود-البركة.html');
const assets = join(root, 'android/app/src/main/assets/public');

if (!existsSync(single)) {
  console.error('لا يوجد ملف عقود-البركة.html — شغّل أولاً:  npm run build:single');
  process.exit(1);
}
if (!existsSync(assets)) {
  console.error('لا يوجد مشروع أندرويد — شغّل أولاً:  npx cap add android && npx cap sync android');
  process.exit(1);
}

mkdirSync(assets, { recursive: true });
copyFileSync(single, join(assets, 'index.html'));
console.log('نُسخ الملف الواحد إلى مشروع أندرويد. ابنِ الآن:  npm run android:apk');
