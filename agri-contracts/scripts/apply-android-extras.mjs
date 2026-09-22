#!/usr/bin/env node
// يدمج إضافات أندرويد (ملحق الطباعة) داخل مشروع أندرويد الذي يولّده Capacitor.
// يُشغَّل بعد `npx cap add android` وبعد كل `npx cap sync android`.
// آمن للتكرار: لا يكرّر ما أضافه سابقاً.

import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const extra = join(root, 'android-extra');
const android = join(root, 'android');
const PKG = 'iq.albaraka.contracts';
const pkgPath = join(android, 'app/src/main/java', ...PKG.split('.'));

if (!existsSync(android)) {
  console.error('لا يوجد مجلد android. شغّل أولاً:  npx cap add android');
  process.exit(1);
}

const done = [];
const skipped = [];

/* 1) ملفات الملحق */
mkdirSync(pkgPath, { recursive: true });
for (const file of ['NativePrintPlugin.java', 'IppClient.java']) {
  copyFileSync(join(extra, file), join(pkgPath, file));
  done.push(`نُسخ ${file}`);
}

/* 2) تسجيل الملحق في MainActivity */
const mainActivity = join(pkgPath, 'MainActivity.java');
if (existsSync(mainActivity)) {
  let src = readFileSync(mainActivity, 'utf8');
  if (src.includes('NativePrintPlugin.class')) {
    skipped.push('الملحق مسجَّل مسبقاً في MainActivity');
  } else if (/public class MainActivity extends BridgeActivity\s*\{/.test(src)) {
    if (!src.includes('import android.os.Bundle;')) {
      src = src.replace(/(package [^;]+;\n)/, '$1\nimport android.os.Bundle;\n');
    }
    src = src.replace(
      /public class MainActivity extends BridgeActivity\s*\{/,
      `public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativePrintPlugin.class);
        super.onCreate(savedInstanceState);
    }
`,
    );
    writeFileSync(mainActivity, src);
    done.push('سُجّل NativePrintPlugin في MainActivity');
  } else {
    skipped.push('تعذّر تعديل MainActivity تلقائياً — أضف registerPlugin(NativePrintPlugin.class) يدوياً');
  }
}

/* 3) مسارات FileProvider لمشاركة PDF */
const xmlDir = join(android, 'app/src/main/res/xml');
mkdirSync(xmlDir, { recursive: true });
copyFileSync(join(extra, 'file_paths.xml'), join(xmlDir, 'file_paths.xml'));
done.push('حُدِّث file_paths.xml');

/* 4) السماح بالاتصال غير المشفّر بالطابعة على الشبكة المحلية (IPP) */
const nsc = join(xmlDir, 'network_security_config.xml');
writeFileSync(nsc, `<?xml version="1.0" encoding="utf-8"?>
<!-- الطباعة المباشرة عبر IPP تتم على شبكة المعرض المحلية بلا تشفير،
     والتطبيق لا يتصل بأي خدمة أخرى على الإنترنت. -->
<network-security-config>
    <base-config cleartextTrafficPermitted="true" />
</network-security-config>
`);
done.push('كُتب network_security_config.xml');

const manifestPath = join(android, 'app/src/main/AndroidManifest.xml');
if (existsSync(manifestPath)) {
  let manifest = readFileSync(manifestPath, 'utf8');
  if (manifest.includes('android:networkSecurityConfig')) {
    skipped.push('networkSecurityConfig مضبوط مسبقاً في AndroidManifest');
  } else {
    manifest = manifest.replace(
      /<application\b/,
      '<application\n        android:networkSecurityConfig="@xml/network_security_config"',
    );
    writeFileSync(manifestPath, manifest);
    done.push('رُبط networkSecurityConfig في AndroidManifest');
  }
}

console.log('إضافات أندرويد:');
for (const d of done) console.log('  ✓ ' + d);
for (const s of skipped) console.log('  • ' + s);
