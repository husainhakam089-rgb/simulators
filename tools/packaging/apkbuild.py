# بناء APK بسيط (WebView يعرض المحاكي بلا إنترنت) بأدوات محلية فقط:
# مانيفست ثنائي (AXML) + resources.arsc للأيقونة + classes.dex مكتوب يدوياً + توقيع v1 بـ jarsigner
import struct, zlib, hashlib, sys, os, zipfile, subprocess

PKG = os.environ.get('APK_PKG', 'com.sajjad.cell')   # معرّف مختلف لكل أستاذ حتى تتثبت النسخ جنب بعض
CLS = 'L' + PKG.replace('.', '/') + '/Main;'
LABEL = os.environ.get('APK_LABEL', 'الخلية')   # اسم التطبيق (مثلاً «الأنسجة» للفصل الثاني)

# ───────────────────────── أدوات ترميز ─────────────────────────
def uleb(n):
    out = bytearray()
    while True:
        b = n & 0x7f; n >>= 7
        if n: out.append(b | 0x80)
        else: out.append(b); return bytes(out)

def align(b, n=4):
    return b + b'\0' * ((-len(b)) % n)

# ───────────────── مجمّع النصوص (String pool) بترميز UTF-8 ─────────────────
def str_pool(strings, utf8=True):
    def enc_len8(n):
        return bytes([n]) if n < 0x80 else bytes([(n >> 8) | 0x80, n & 0xff])
    def enc_len16(n):
        return struct.pack('<H', n) if n < 0x8000 else struct.pack('<HH', (n >> 16) | 0x8000, n & 0xffff)
    data = bytearray(); offs = []
    for s in strings:
        offs.append(len(data))
        if utf8:
            bs = s.encode('utf-8')
            data += enc_len8(len(s.encode('utf-16-le')) // 2) + enc_len8(len(bs)) + bs + b'\0'
        else:
            u = s.encode('utf-16-le')
            data += enc_len16(len(u) // 2) + u + b'\0\0'
    data = align(bytes(data))
    hdr_size = 28
    strings_start = hdr_size + 4 * len(strings)
    size = strings_start + len(data)
    hdr = struct.pack('<HHIIIIII', 0x0001, hdr_size, size, len(strings), 0, 0x100 if utf8 else 0, strings_start, 0)
    return hdr + b''.join(struct.pack('<I', o) for o in offs) + data

# ───────────────────────── المانيفست الثنائي ─────────────────────────
ANDROID_NS = 'http://schemas.android.com/apk/res/android'
ATTR_IDS = {  # معرّفات خصائص أندرويد الثابتة (android.R.attr)
    'label': 0x01010001, 'icon': 0x01010002, 'name': 0x01010003, 'exported': 0x01010010,
    'configChanges': 0x0101001f, 'minSdkVersion': 0x0101020c, 'versionCode': 0x0101021b,
    'versionName': 0x0101021c, 'targetSdkVersion': 0x01010270, 'hardwareAccelerated': 0x010102d3,
}
T_REF, T_STR, T_DEC, T_HEX, T_BOOL = 0x01, 0x03, 0x10, 0x11, 0x12

def axml(tree):
    # tree: (tag, [(ns_android?, name, type, value)], [children])
    res_names = sorted(ATTR_IDS, key=lambda k: ATTR_IDS[k])
    strings = list(res_names)
    def S(s):
        if s not in strings: strings.append(s)
        return strings.index(s)
    for s in ['android', ANDROID_NS]: S(s)
    def collect(node):
        tag, attrs, kids = node
        S(tag)
        for ns, name, t, v in attrs:
            S(name)
            if t == T_STR: S(v)
        for k in kids: collect(k)
    collect(tree)
    chunks = []
    def node_chunks(node, line=[1]):
        tag, attrs, kids = node
        def key(a):
            ns, name, t, v = a
            return (ATTR_IDS.get(name, 0) if ns else 0, name)
        attrs = sorted(attrs, key=key)
        body = b''
        for ns, name, t, v in attrs:
            ns_i = S(ANDROID_NS) if ns else 0xffffffff
            raw = S(v) if t == T_STR else 0xffffffff
            data = S(v) if t == T_STR else (0xffffffff if (t == T_BOOL and v) else (0 if t == T_BOOL else v))
            body += struct.pack('<IIIHBBI', ns_i, S(name), raw, 8, 0, t, data)
        ext = struct.pack('<IIHHHHHH', 0xffffffff, S(tag), 20, 20, len(attrs), 0, 0, 0)
        chunks.append(struct.pack('<HHIII', 0x0102, 16, 16 + len(ext) + len(body), line[0], 0xffffffff) + ext + body)
        line[0] += 1
        for k in kids: node_chunks(k, line)
        chunks.append(struct.pack('<HHIIIII', 0x0103, 16, 24, line[0], 0xffffffff, 0xffffffff, S(tag)))
        line[0] += 1
    ns_start = struct.pack('<HHIIIII', 0x0100, 16, 24, 1, 0xffffffff, S('android'), S(ANDROID_NS))
    node_chunks(tree)
    ns_end = struct.pack('<HHIIIII', 0x0101, 16, 24, 1, 0xffffffff, S('android'), S(ANDROID_NS))
    pool = str_pool(strings)
    rmap = b''.join(struct.pack('<I', ATTR_IDS[n]) for n in res_names)
    rmap = struct.pack('<HHI', 0x0180, 8, 8 + len(rmap)) + rmap
    body = pool + rmap + ns_start + b''.join(chunks) + ns_end
    return struct.pack('<HHI', 0x0003, 8, 8 + len(body)) + body

ICON_ID = 0x7f010000
manifest = ('manifest', [(False, 'package', T_STR, PKG), (True, 'versionCode', T_DEC, 1), (True, 'versionName', T_STR, '1.0')], [
    ('uses-sdk', [(True, 'minSdkVersion', T_DEC, 21), (True, 'targetSdkVersion', T_DEC, 29)], []),
    ('application', [(True, 'label', T_STR, LABEL), (True, 'icon', T_REF, ICON_ID), (True, 'hardwareAccelerated', T_BOOL, True)], [
        ('activity', [(True, 'name', T_STR, PKG + '.Main'), (True, 'exported', T_BOOL, True), (True, 'configChanges', T_HEX, 0xFA0)], [
            ('intent-filter', [], [
                ('action', [(True, 'name', T_STR, 'android.intent.action.MAIN')], []),
                ('category', [(True, 'name', T_STR, 'android.intent.category.LAUNCHER')], []),
            ]),
        ]),
    ]),
])

# ───────────────────────── resources.arsc (أيقونة واحدة) ─────────────────────────
def arsc(icon_path):
    gpool = str_pool([icon_path])
    type_pool = str_pool(['drawable'], utf8=False)
    key_pool = str_pool(['icon'], utf8=False)
    spec = struct.pack('<HHIBBHI', 0x0202, 16, 16 + 4, 1, 0, 0, 1) + struct.pack('<I', 0)
    config = struct.pack('<I', 64) + b'\0' * 60          # الإعداد الافتراضي
    hdr_size = 20 + 64
    entries_start = hdr_size + 4
    entry = struct.pack('<HHI', 8, 0, 0) + struct.pack('<HBBI', 8, 0, T_STR, 0)
    ttype = struct.pack('<HHIBBHII', 0x0201, hdr_size, entries_start + len(entry), 1, 0, 0, 1, entries_start) + config
    ttype += struct.pack('<I', 0) + entry
    pkg_hdr_size = 288
    name = PKG.encode('utf-16-le').ljust(256, b'\0')
    type_off = pkg_hdr_size
    key_off = type_off + len(type_pool)
    body = type_pool + key_pool + spec + ttype
    pkg = struct.pack('<HHII', 0x0200, pkg_hdr_size, pkg_hdr_size + len(body), 0x7f) + name + \
          struct.pack('<IIIII', type_off, 1, key_off, 1, 0) + body
    assert len(pkg) == pkg_hdr_size + len(body)
    total = 12 + len(gpool) + len(pkg)
    return struct.pack('<HHII', 0x0002, 12, total, 1) + gpool + pkg

# ───────────────────────── classes.dex ─────────────────────────
def build_dex():
    WV, WS, ACT = 'Landroid/webkit/WebView;', 'Landroid/webkit/WebSettings;', 'Landroid/app/Activity;'
    WVC, WCC = 'Landroid/webkit/WebViewClient;', 'Landroid/webkit/WebChromeClient;'
    BUN, CTX, VIEW, STR = 'Landroid/os/Bundle;', 'Landroid/content/Context;', 'Landroid/view/View;', 'Ljava/lang/String;'
    URL = 'file:///android_asset/index.html'
    meths = [  # (class, name, ret, params)
        (ACT, '<init>', 'V', []), (ACT, 'onCreate', 'V', [BUN]), (ACT, 'onBackPressed', 'V', []),
        (ACT, 'requestWindowFeature', 'Z', ['I']), (ACT, 'setContentView', 'V', [VIEW]),
        (WV, '<init>', 'V', [CTX]), (WV, 'getSettings', WS, []), (WV, 'setWebViewClient', 'V', [WVC]),
        (WV, 'setWebChromeClient', 'V', [WCC]), (WV, 'loadUrl', 'V', [STR]), (WV, 'canGoBack', 'Z', []), (WV, 'goBack', 'V', []),
        (WS, 'setJavaScriptEnabled', 'V', ['Z']), (WS, 'setDomStorageEnabled', 'V', ['Z']), (WS, 'setAllowFileAccess', 'V', ['Z']),
        (WS, 'setMediaPlaybackRequiresUserGesture', 'V', ['Z']),
        (WVC, '<init>', 'V', []), (WCC, '<init>', 'V', []),
        (CLS, '<init>', 'V', []), (CLS, 'onCreate', 'V', [BUN]), (CLS, 'onBackPressed', 'V', []),
    ]
    fields = [(CLS, 'web', WV)]
    shorty = lambda r, ps: ''.join('L' if t[0] in 'L[' else t for t in [r] + ps)
    protos = sorted({(r, tuple(ps)) for _, _, r, ps in meths})
    strings = set([URL])
    for c, n, r, ps in meths:
        strings |= {c, n, r, shorty(r, ps)} | set(ps)
    for c, n, t in fields: strings |= {c, n, t}
    strings = sorted(strings, key=lambda s: s.encode('utf-16-be'))
    sidx = {s: i for i, s in enumerate(strings)}
    types = sorted({s for s in strings if s[0] in 'LV[ZIJBSCFD' and (s[0] != 'L' or s.endswith(';')) and (len(s) == 1 or s[0] in 'L[')}, key=lambda s: sidx[s])
    # الأنواع المستعملة فعلاً فقط
    used = set([CLS, ACT])
    for c, n, r, ps in meths: used |= {c, r} | set(ps)
    for c, n, t in fields: used |= {c, t}
    types = sorted(used, key=lambda s: sidx[s])
    tidx = {t: i for i, t in enumerate(types)}
    protos = sorted(protos, key=lambda p: (tidx[p[0]], [tidx[x] for x in p[1]]))
    pidx = {p: i for i, p in enumerate(protos)}
    meths_sorted = sorted(meths, key=lambda m: (tidx[m[0]], sidx[m[1]], pidx[(m[2], tuple(m[3]))]))
    midx = {(m[0], m[1], m[2], tuple(m[3])): i for i, m in enumerate(meths_sorted)}
    M = lambda c, n, r, ps=(): midx[(c, n, r, tuple(ps))]
    fidx = {f: i for i, f in enumerate(sorted(fields, key=lambda f: (tidx[f[0]], sidx[f[1]], tidx[f[2]])))}
    F_WEB = fidx[fields[0]]

    def i35(op, regs, meth):
        A = len(regs); r = list(regs) + [0] * (5 - len(regs))
        return [(A << 12) | (r[4] << 8) | op, meth, (r[3] << 12) | (r[2] << 8) | (r[1] << 4) | r[0]]
    const4 = lambda a, b: [(b << 12) | (a << 8) | 0x12]
    # <init>: super()
    init = [*i35(0x70, [0], M(ACT, '<init>', 'V')), 0x000e]
    # onCreate: v4=this v5=bundle
    oc = []
    oc += i35(0x6f, [4, 5], M(ACT, 'onCreate', 'V', [BUN]))
    oc += const4(0, 1)
    oc += i35(0x6e, [4, 0], M(ACT, 'requestWindowFeature', 'Z', ['I']))          # بلا شريط عنوان
    oc += [(0 << 8) | 0x22, tidx[WV]]                                               # new-instance v0, WebView
    oc += i35(0x70, [0, 4], M(WV, '<init>', 'V', [CTX]))
    oc += [(4 << 12) | (0 << 8) | 0x5b, F_WEB]                                      # iput-object v0, v4, web
    oc += i35(0x6e, [0], M(WV, 'getSettings', WS))
    oc += [(1 << 8) | 0x0c]                                                         # move-result-object v1
    oc += const4(2, 1)
    oc += i35(0x6e, [1, 2], M(WS, 'setJavaScriptEnabled', 'V', ['Z']))
    oc += i35(0x6e, [1, 2], M(WS, 'setDomStorageEnabled', 'V', ['Z']))
    oc += i35(0x6e, [1, 2], M(WS, 'setAllowFileAccess', 'V', ['Z']))
    oc += const4(2, 0)
    oc += i35(0x6e, [1, 2], M(WS, 'setMediaPlaybackRequiresUserGesture', 'V', ['Z']))
    oc += [(2 << 8) | 0x22, tidx[WVC]]
    oc += i35(0x70, [2], M(WVC, '<init>', 'V'))
    oc += i35(0x6e, [0, 2], M(WV, 'setWebViewClient', 'V', [WVC]))
    oc += [(2 << 8) | 0x22, tidx[WCC]]
    oc += i35(0x70, [2], M(WCC, '<init>', 'V'))
    oc += i35(0x6e, [0, 2], M(WV, 'setWebChromeClient', 'V', [WCC]))
    oc += [(2 << 8) | 0x1a, sidx[URL]]                                              # const-string v2, URL
    oc += i35(0x6e, [0, 2], M(WV, 'loadUrl', 'V', [STR]))
    oc += i35(0x6e, [4, 0], M(ACT, 'setContentView', 'V', [VIEW]))
    oc += [0x000e]
    # onBackPressed: v2=this — رجوع داخل الصفحة إن أمكن وإلا الخروج
    ob = []
    ob += [(2 << 12) | (0 << 8) | 0x54, F_WEB]                                      # iget-object v0, v2, web  @0
    ob += i35(0x6e, [0], M(WV, 'canGoBack', 'Z'))                                   # @2
    ob += [(1 << 8) | 0x0a]                                                         # move-result v1 @5
    ob += [(1 << 8) | 0x38, 6]                                                      # if-eqz v1, +6 @6 → @12
    ob += i35(0x6e, [0], M(WV, 'goBack', 'V'))                                      # @8
    ob += [0x000e]                                                                  # @11
    ob += i35(0x6f, [2], M(ACT, 'onBackPressed', 'V'))                              # @12
    ob += [0x000e]
    assert len(ob) == 16

    def code_item(regs, ins, outs, insns):
        b = struct.pack('<HHHHII', regs, ins, outs, 0, 0, len(insns)) + b''.join(struct.pack('<H', x) for x in insns)
        return align(b)
    codes = {('<init>'): code_item(1, 1, 1, init), 'onCreate': code_item(6, 2, 2, oc), 'onBackPressed': code_item(3, 1, 1, ob)}

    # ── تخطيط الملف ──
    n_str, n_typ, n_pro, n_fld, n_met = len(strings), len(types), len(protos), len(fidx), len(meths_sorted)
    off = 0x70
    str_ids_off = off; off += 4 * n_str
    typ_ids_off = off; off += 4 * n_typ
    pro_ids_off = off; off += 12 * n_pro
    fld_ids_off = off; off += 8 * n_fld
    met_ids_off = off; off += 8 * n_met
    cls_def_off = off; off += 32
    data_off = off
    data = bytearray()
    def place(blob, al=4):
        nonlocal data
        pad = (-(data_off + len(data))) % al
        data += b'\0' * pad
        o = data_off + len(data); data += blob; return o
    # type_lists للمعاملات
    tl_off = {}
    for r, ps in protos:
        if ps and ps not in tl_off:
            tl_off[ps] = place(struct.pack('<I', len(ps)) + b''.join(struct.pack('<H', tidx[p]) for p in ps) + (b'\0\0' if len(ps) % 2 else b''))
    tl_list = list(tl_off.values())
    code_off = {k: place(v) for k, v in codes.items()}
    code_first = min(code_off.values())
    # النصوص
    sdata_off = []
    for s in strings:
        u16 = len(s.encode('utf-16-le')) // 2
        sdata_off.append(place(uleb(u16) + s.encode('utf-8') + b'\0', 1))
    # class_data
    m_init, m_oc, m_ob = M(CLS, '<init>', 'V'), M(CLS, 'onCreate', 'V', [BUN]), M(CLS, 'onBackPressed', 'V')
    virt = sorted([(m_oc, 0x4, code_off['onCreate']), (m_ob, 0x1, code_off['onBackPressed'])])
    cd = uleb(0) + uleb(1) + uleb(1) + uleb(2)
    cd += uleb(F_WEB) + uleb(0x2)                                  # private web
    cd += uleb(m_init) + uleb(0x10001) + uleb(code_off['<init>'])
    prev = 0
    for mi, acc, co in virt:
        cd += uleb(mi - prev) + uleb(acc) + uleb(co); prev = mi
    class_data_off = place(cd, 1)
    # map_list
    map_off_pos = (data_off + len(data) + 3) & ~3
    items = [(0x0000, 1, 0), (0x0001, n_str, str_ids_off), (0x0002, n_typ, typ_ids_off), (0x0003, n_pro, pro_ids_off),
             (0x0004, n_fld, fld_ids_off), (0x0005, n_met, met_ids_off), (0x0006, 1, cls_def_off),
             (0x1001, len(tl_list), min(tl_list)), (0x2001, len(codes), code_first),
             (0x2002, n_str, sdata_off[0]), (0x2000, 1, class_data_off), (0x1000, 1, map_off_pos)]
    items.sort(key=lambda x: x[2])
    ml = struct.pack('<I', len(items)) + b''.join(struct.pack('<HHII', t, 0, c, o) for t, c, o in items)
    map_off = place(ml)
    assert map_off == map_off_pos
    file_size = data_off + len(data)

    body = bytearray()
    body += b''.join(struct.pack('<I', o) for o in sdata_off)
    body += b''.join(struct.pack('<I', sidx[t]) for t in types)
    for r, ps in protos:
        body += struct.pack('<III', sidx[shorty(r, list(ps))], tidx[r], tl_off[ps] if ps else 0)
    for f, i in sorted(fidx.items(), key=lambda x: x[1]):
        body += struct.pack('<HHI', tidx[f[0]], tidx[f[2]], sidx[f[1]])
    for c, n, r, ps in meths_sorted:
        body += struct.pack('<HHI', tidx[c], pidx[(r, tuple(ps))], sidx[n])
    body += struct.pack('<IIIIIIII', tidx[CLS], 0x1, tidx[ACT], 0, 0xffffffff, 0, class_data_off, 0)
    assert 0x70 + len(body) == data_off
    hdr = bytearray(b'dex\n035\0' + b'\0' * 4 + b'\0' * 20)
    hdr += struct.pack('<IIIIIIIIIIIIIIIIIIII', file_size, 0x70, 0x12345678, 0, 0, map_off,
                       n_str, str_ids_off, n_typ, typ_ids_off, n_pro, pro_ids_off, n_fld, fld_ids_off,
                       n_met, met_ids_off, 1, cls_def_off, len(data), data_off)
    dex = bytearray(hdr + body + data)
    assert len(dex) == file_size
    dex[12:32] = hashlib.sha1(dex[32:]).digest()
    dex[8:12] = struct.pack('<I', zlib.adler32(bytes(dex[12:])) & 0xffffffff)
    return bytes(dex)

# ───────────────────────── تجميع وتوقيع ─────────────────────────
def build(html, icon_png, out, ks, ks_pass):
    unsigned = out + '.unsigned'
    with zipfile.ZipFile(unsigned, 'w') as z:
        z.writestr(zipfile.ZipInfo('AndroidManifest.xml'), axml(manifest), compress_type=zipfile.ZIP_DEFLATED)
        z.writestr(zipfile.ZipInfo('classes.dex'), build_dex(), compress_type=zipfile.ZIP_DEFLATED)
        z.writestr(zipfile.ZipInfo('resources.arsc'), arsc('res/drawable/icon.png'), compress_type=zipfile.ZIP_STORED)
        z.write(icon_png, 'res/drawable/icon.png', compress_type=zipfile.ZIP_STORED)
        z.write(html, 'assets/index.html', compress_type=zipfile.ZIP_DEFLATED)
    subprocess.run(['jarsigner', '-keystore', ks, '-storepass', ks_pass, '-sigalg', 'SHA256withRSA', '-digestalg', 'SHA-256',
                    '-signedjar', out, unsigned, 'cell'], check=True, stdout=subprocess.DEVNULL)
    os.remove(unsigned)

if __name__ == '__main__':
    build(*sys.argv[1:6])
