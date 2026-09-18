#!/usr/bin/env python3
"""يبني نسخة الملف الواحد من التطبيق.

المجلد العادي (index.html + assets/ + chapters/) يحتاج خادم ملفات ثابت لأن
الفصلين يُحمَّلان عبر iframe. هذا السكربت يولّد ملفاً واحداً مكتفياً بذاته
تُفتح بالنقر المزدوج: الصورة تُدمج كـ data URI، وكل فصل يُدمج مُرمَّزاً
بـ base64 ويُحقن وقت التشغيل في الإطار عبر srcdoc — فيبقى كل فصل معزولاً
تماماً كما لو كان ملفاً مستقلاً، بلا تعارض في المعرّفات أو الأنماط.

    python3 physics-lab-2/build-standalone.py
"""

import base64
import io
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'index.html')
OUT = os.path.join(HERE, 'physics-lab-2-standalone.html')
IMAGE = os.path.join(HERE, 'assets', 'welcome.jpg')
LOGO = os.path.join(HERE, 'assets', 'logo.png')
CHAPTERS = [
    ('ch3', os.path.join(HERE, 'chapters', 'chapter-3-ac.html')),
    ('ch4', os.path.join(HERE, 'chapters', 'chapter-4-emwaves.html')),
]


def read_text(path):
    with io.open(path, encoding='utf-8') as fh:
        return fh.read()


def b64_file(path):
    with open(path, 'rb') as fh:
        return base64.b64encode(fh.read()).decode('ascii')


def replace_once(html, old, new, label):
    if old not in html:
        sys.exit('build failed: could not find %s in index.html' % label)
    return html.replace(old, new, 1)


def main():
    html = read_text(SRC)

    # 1) الصورة: مرجعان إليها — خلفية CSS المموّهة ووسم <img>
    data_uri = 'data:image/jpeg;base64,' + b64_file(IMAGE)
    html = replace_once(html, "url('assets/welcome.jpg')",
                        "url('%s')" % data_uri, 'backdrop image url')
    html = replace_once(html, 'src="assets/welcome.jpg"',
                        'src="%s"' % data_uri, 'splash <img> src')

    # الشعار: مقصوص من الصورة نفسها. الفصلان يحملانه مدمجاً أصلاً، فلا يحتاج
    # إلا شعار الواجهة هنا.
    logo_uri = 'data:image/png;base64,' + b64_file(LOGO)
    html = replace_once(html, 'src="assets/logo.png"',
                        'src="%s"' % logo_uri, 'picker logo src')

    # 2) الفصلان: base64 داخل كتل نصية لا يفسّرها المتصفح
    blocks = []
    for key, path in CHAPTERS:
        blocks.append(
            '<script type="text/plain" id="%s-data">%s</script>'
            % (key, b64_file(path))
        )
        html = replace_once(
            html,
            'data-src="chapters/%s"' % os.path.basename(path),
            'data-chapter-src="%s-data"' % key,
            'iframe source for %s' % key,
        )

    # 3) التحميل: srcdoc بدل src
    old_load = """    var frame = pane.querySelector('iframe');
    if(!frame || frame.src) return;
    var loading = pane.querySelector('.pane-loading');
    frame.addEventListener('load', function(){
      if(loading) loading.classList.add('done');
    });
    frame.src = frame.getAttribute('data-src');"""
    new_load = """    var frame = pane.querySelector('iframe');
    if(!frame || frame.srcdoc) return;
    var holder = document.getElementById(frame.getAttribute('data-chapter-src'));
    if(!holder) return;
    var loading = pane.querySelector('.pane-loading');
    frame.addEventListener('load', function(){
      if(loading) loading.classList.add('done');
    });
    frame.srcdoc = decodeChapter(holder.textContent);"""
    html = replace_once(html, old_load, new_load, 'loadPane body')

    decoder = """  /* الفصول مخزَّنة بـ base64 داخل الصفحة؛ نفكّها إلى نص UTF-8 */
  function decodeChapter(b64){
    var bin = atob(b64.trim());
    var bytes = new Uint8Array(bin.length);
    for(var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder('utf-8').decode(bytes);
  }

  var splash   = document.getElementById('splash');"""
    html = replace_once(html, "  var splash   = document.getElementById('splash');",
                        decoder, 'splash variable declaration')

    html = replace_once(html, '</body>', '\n'.join(blocks) + '\n</body>',
                        'closing body tag')

    with io.open(OUT, 'w', encoding='utf-8') as fh:
        fh.write(html)
    print('wrote %s (%.1f MB)' % (OUT, os.path.getsize(OUT) / 1048576.0))


if __name__ == '__main__':
    main()
