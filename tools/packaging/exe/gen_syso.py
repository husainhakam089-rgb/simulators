# ملف موارد COFF (rsrc.syso) فيه أيقونة البرنامج، يلتقطه رابط Go تلقائياً
import struct, sys, io
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGBA')
imgs = []
for s in [16, 20, 24, 32, 40, 48, 64, 96, 128, 256]:
    r = im.resize((s, s), Image.LANCZOS)
    if s == 256:
        b = io.BytesIO(); r.save(b, 'PNG', optimize=True); data = b.getvalue()
    else:   # صورة DIB بـ 32 بت + قناع AND (أكثر توافقاً للأحجام الصغيرة)
        px = r.tobytes('raw', 'BGRA')
        rows = [px[y * s * 4:(y + 1) * s * 4] for y in range(s)][::-1]
        mask_row = ((s + 31) // 32) * 4
        data = struct.pack('<IiiHHIIiiII', 40, s, s * 2, 1, 32, 0, s * s * 4 + mask_row * s, 0, 0, 0, 0) + b''.join(rows) + b'\0' * (mask_row * s)
    imgs.append((s, data))
RT_ICON, RT_GROUP_ICON, LANG = 3, 14, 0x0409
grp = struct.pack('<HHH', 0, 1, len(imgs)) + b''.join(
    struct.pack('<BBBBHHIH', 0 if s == 256 else s, 0 if s == 256 else s, 0, 0, 1, 32, len(d), i + 1) for i, (s, d) in enumerate(imgs))
# بنية الدلائل: الجذر → النوع → المعرّف → اللغة → بيانات
leaves = [(RT_ICON, i + 1, d) for i, (s, d) in enumerate(imgs)] + [(RT_GROUP_ICON, 1, grp)]
types = sorted({t for t, _, _ in leaves})
def dir_hdr(n): return struct.pack('<IIHHHH', 0, 0, 0, 0, 0, n)
# حساب الأحجام والإزاحات
root_sz = 16 + 8 * len(types)
type_dirs = {t: [l for l in leaves if l[0] == t] for t in types}
off = root_sz
type_off = {}
for t in types: type_off[t] = off; off += 16 + 8 * len(type_dirs[t])
name_off = {}
for t in types:
    for l in type_dirs[t]: name_off[(t, l[1])] = off; off += 16 + 8
entry_off = {}
for t in types:
    for l in type_dirs[t]: entry_off[(t, l[1])] = off; off += 16
data_off = {}
for t in types:
    for l in type_dirs[t]:
        off = (off + 7) & ~7; data_off[(t, l[1])] = off; off += len(l[2])
sec = bytearray(off)
def put(o, b): sec[o:o + len(b)] = b
put(0, dir_hdr(len(types)) + b''.join(struct.pack('<II', t, 0x80000000 | type_off[t]) for t in types))
relocs = []
for t in types:
    put(type_off[t], dir_hdr(len(type_dirs[t])) + b''.join(struct.pack('<II', l[1], 0x80000000 | name_off[(t, l[1])]) for l in type_dirs[t]))
    for l in type_dirs[t]:
        k = (t, l[1])
        put(name_off[k], dir_hdr(1) + struct.pack('<II', LANG, entry_off[k]))
        put(entry_off[k], struct.pack('<IIII', data_off[k], len(l[2]), 0, 0))
        relocs.append(entry_off[k])          # OffsetToData عنوان نسبي يُصحَّح عند الربط
        put(data_off[k], l[2])
sec = bytes(sec)
hdr_sz, sh_sz = 20, 40
raw_ptr = hdr_sz + sh_sz
rel_ptr = raw_ptr + len(sec)
sym_ptr = rel_ptr + 10 * len(relocs)
fh = struct.pack('<HHIIIHH', 0x8664, 1, 0, sym_ptr, 1, 0, 0)
sh = b'.rsrc\0\0\0' + struct.pack('<IIIIIIHHI', 0, 0, len(sec), raw_ptr, rel_ptr, 0, len(relocs), 0, 0x40000040)
rel = b''.join(struct.pack('<IIH', r, 0, 3) for r in relocs)   # IMAGE_REL_AMD64_ADDR32NB
sym = b'.rsrc\0\0\0' + struct.pack('<IhHBB', 0, 1, 0, 3, 0)
open(out, 'wb').write(fh + sh + sec + rel + sym + struct.pack('<I', 4))
print('syso', len(imgs), 'icons', len(sec), 'bytes')
