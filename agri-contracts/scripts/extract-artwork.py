#!/usr/bin/env python3
"""
يستخرج رسومات العقد من صورة العقد الورقي ويجهّزها للطباعة.

المصدر : artwork-source/contract-scan.jpg
المخرج : www/assets/art/*  و  www/js/artwork.js  و  رسومات-العقد.zip

التشغيل:  python3 scripts/extract-artwork.py
المتطلبات: pip install Pillow numpy

إن وصلت صورة أوضح للعقد، استبدل ملف المصدر واضبط الاقتصاصات في CROPS
(إحداثيات بالبكسل على صورة المصدر) ثم أعد التشغيل.
"""

import base64
import io
import json
import zipfile
from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "artwork-source" / "contract-scan.jpg"
ART_DIR = ROOT / "www" / "assets" / "art"
JS_OUT = ROOT / "www" / "js" / "artwork.js"
ZIP_OUT = ROOT / "رسومات-العقد.zip"

# اقتصاصات على صورة المصدر الحالية (899×1599)
CROPS = {
    "tractor": (64, 200, 250, 320),
    "car": (614, 204, 797, 284),
    "logo": (268, 196, 594, 295),
    "corner": (0, 1288, 80, 1395),
}
# العرض النهائي بالبكسل — مقيس على الطباعة بدقة 300 نقطة/إنش
TARGET_WIDTH = {"tractor": 540, "car": 540, "logo": 760, "corner": 260}


def flatten_light(img: Image.Image, radius: int = 14) -> Image.Image:
    """قسمة الصورة على نسخة مموّهة منها لإزالة تدرّج إضاءة التصوير."""
    a = np.asarray(img).astype(np.float32)
    blur = np.asarray(img.filter(ImageFilter.GaussianBlur(radius))).astype(np.float32)
    return Image.fromarray(np.clip(a / np.maximum(blur, 1.0) * 245.0, 0, 255).astype(np.uint8))


def normalize_paper(img: Image.Image, band: int = 5, lift: float = 0.965) -> Image.Image:
    """
    جعل لون الورقة أبيض نقياً كي يذوب الاقتصاص في بياض الصفحة.
    يُقاس لون الورقة من شريط الحواف وحده — لا من الصورة كلها — لأن وسط
    الاقتصاص هو الرسم نفسه، فلو دخل في الحساب لبهت الرسم. وبلا هذا الضبط
    يبقى مستطيل رمادي باهت حول الرسم عند الطباعة.
    """
    a = np.asarray(img).astype(np.float32)
    edges = np.concatenate([
        a[:band].reshape(-1, 3), a[-band:].reshape(-1, 3),
        a[:, :band].reshape(-1, 3), a[:, -band:].reshape(-1, 3),
    ])
    paper = np.maximum(np.percentile(edges, 60, axis=0), 1.0)
    return Image.fromarray(np.clip(a * (255.0 / (paper * lift)), 0, 255).astype(np.uint8))


def unpremultiply_white(img: Image.Image, floor: float = 0.16, gain: float = 1.5) -> Image.Image:
    """
    فصل الحبر عن بياض الورقة: كل لون مرصود مزيج حبر مع أبيض، فتُشتق
    الشفافية من أغمق قناة ويُستعاد لون الحبر — وبها تبقى الزخرفة بلونها
    الحيّ بدل أن تبهت، وتُركَّب فوق إطار العقد بلا مربّع أبيض حولها.
    """
    a = np.asarray(img.convert("RGB")).astype(np.float32)
    alpha = np.clip((1.0 - a.min(axis=2) / 255.0) * gain, 0, 1)
    alpha[alpha < floor] = 0.0
    safe = np.maximum(alpha, 1e-3)[..., None]
    ink = np.clip((a - 255.0 * (1.0 - safe)) / safe, 0, 255)
    return Image.fromarray(np.dstack([ink, alpha * 255.0]).astype(np.uint8), "RGBA")


def sharpen_to(img: Image.Image, width: int) -> Image.Image:
    scale = max(1, round(width / img.width * 2))
    big = img.resize((img.width * scale, img.height * scale), Image.LANCZOS)
    big = big.filter(ImageFilter.UnsharpMask(radius=3, percent=110, threshold=3))
    height = round(big.height * width / big.width)
    return big.resize((width, height), Image.LANCZOS)


def extract():
    src = Image.open(SOURCE).convert("RGB")
    ART_DIR.mkdir(parents=True, exist_ok=True)
    produced = {}

    for name, box in CROPS.items():
        crop = src.crop(box)
        if name == "corner":
            # الزخرفة تُركَّب على الإطار، فتحتاج خلفية شفافة
            crop = flatten_light(crop)
            crop = crop.filter(ImageFilter.MedianFilter(3))
            crop = ImageEnhance.Color(crop).enhance(1.35)
            crop = sharpen_to(crop, TARGET_WIDTH[name])
            out = unpremultiply_white(crop)
            path = ART_DIR / f"{name}.png"
            out.save(path, optimize=True)
        else:
            # بقية الرسومات تجلس على بياض الصفحة، فتكفيها خلفية بيضاء
            crop = normalize_paper(crop)
            crop = ImageEnhance.Color(crop).enhance(1.18)
            crop = ImageEnhance.Contrast(crop).enhance(1.12)
            out = sharpen_to(crop, TARGET_WIDTH[name])
            path = ART_DIR / f"{name}.jpg"
            out.save(path, quality=90, optimize=True, progressive=True)
        produced[name] = path
        print(f"  {name:8s} {box} -> {path.name} {out.size} {path.stat().st_size // 1024} ك.ب")

    return produced


def write_js(produced):
    """الرسومات كـ data URL: مستند الطباعة يُحمَّل منفصلاً فلا تصله المسارات."""
    lines = [
        "// رسومات العقد مستخرجة من صورة الدفتر الورقي.",
        "// مولَّد آلياً بـ scripts/extract-artwork.py — لا يُعدَّل يدوياً.",
        "",
    ]
    const_name = {"tractor": "TRACTOR", "car": "CAR", "logo": "LOGO", "corner": "CORNER"}
    for name, path in produced.items():
        mime = "image/png" if path.suffix == ".png" else "image/jpeg"
        b64 = base64.b64encode(path.read_bytes()).decode()
        lines.append(f"export const {const_name[name]} = 'data:{mime};base64,{b64}';")
        lines.append("")
    with Image.open(produced["corner"]) as corner:
        ratio = corner.height / corner.width
    lines.append("// نسبة ارتفاع زخرفة الزاوية إلى عرضها — يُحسب بها ارتفاعها في القالب.")
    lines.append(f"export const CORNER_RATIO = {ratio:.4f};")
    lines.append("")
    JS_OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"  artwork.js {JS_OUT.stat().st_size // 1024} ك.ب")


def write_zip(produced):
    with zipfile.ZipFile(ZIP_OUT, "w", zipfile.ZIP_DEFLATED) as z:
        for name, path in produced.items():
            z.write(path, path.name)
        z.writestr(
            "اقرأني.txt",
            "رسومات عقد معرض البركة، مستخرجة من صورة الدفتر الورقي.\r\n\r\n"
            "tractor — صورة الترتكتر (يسار رأس العقد)\r\n"
            "car     — صورة السيارة (يمين رأس العقد)\r\n"
            "logo    — شعار «معرض البركة لتجارة السيارات الحديثة» (وسط الرأس)\r\n"
            "corner  — زخرفة الزاوية، بخلفية شفافة، تُقلب للزوايا الأربع\r\n\r\n"
            "لتبديل أي رسم، اختر واحدة:\r\n"
            "  - الأسهل: ارفعه من شاشة الإعدادات داخل التطبيق، ويعلو على المضمّن.\r\n"
            "  - أو ضع صورة العقد الأوضح في artwork-source/contract-scan.jpg\r\n"
            "    واضبط CROPS في أعلى scripts/extract-artwork.py ثم شغّله.\r\n"
            "\r\n"
            "لا تضع البديل في www/assets/art/ وتشغّل السكربت: السكربت يعيد\r\n"
            "توليد ذلك المجلد من صورة المصدر فيمحو ما وضعته.\r\n",
        )
    print(f"  {ZIP_OUT.name} {ZIP_OUT.stat().st_size // 1024} ك.ب")


if __name__ == "__main__":
    print(f"المصدر: {SOURCE.name}")
    produced = extract()
    write_js(produced)
    write_zip(produced)
    print("تم.")
