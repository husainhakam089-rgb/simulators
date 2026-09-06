/**
 * معالجات صورة صغيرة تخدم قراءة الكراتين الحقيقية.
 *
 * أهمها دمج الطباعة النقطية: تاريخ الصلاحية على الكارتون يُطبع بطابعة نقطية،
 * فالحرف نقاط منفصلة لا خط متصل، ومحرك القراءة لا يتعرف عليه. تمويه خفيف ثم
 * بنترة يلحم النقاط فتصير حروفاً.
 */

export function blobToCanvas(bitmap: ImageBitmap, maxWidth: number): HTMLCanvasElement {
  const scale = Math.min(1, maxWidth / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export function grayscale(src: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = src.getContext("2d", { willReadFrequently: true })!;
  const img = ctx.getImageData(0, 0, src.width, src.height);
  const px = img.data;
  for (let i = 0; i < px.length; i += 4) {
    const g = (px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114) | 0;
    px[i] = px[i + 1] = px[i + 2] = g;
  }
  ctx.putImageData(img, 0, 0);
  return src;
}

export function upscale(src: HTMLCanvasElement, factor: number): HTMLCanvasElement {
  if (factor === 1) return src;
  const out = document.createElement("canvas");
  out.width = Math.round(src.width * factor);
  out.height = Math.round(src.height * factor);
  const ctx = out.getContext("2d", { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src, 0, 0, out.width, out.height);
  return out;
}

/** قصّ نسبي من الصورة: {x, y, w, h} كنِسَب ٠..١ */
export function crop(
  src: HTMLCanvasElement,
  r: { x: number; y: number; w: number; h: number },
): HTMLCanvasElement {
  const x = Math.max(0, Math.round(r.x * src.width));
  const y = Math.max(0, Math.round(r.y * src.height));
  const w = Math.min(src.width - x, Math.round(r.w * src.width));
  const h = Math.min(src.height - y, Math.round(r.h * src.height));
  const out = document.createElement("canvas");
  out.width = Math.max(1, w); out.height = Math.max(1, h);
  out.getContext("2d", { willReadFrequently: true })!.drawImage(src, x, y, w, h, 0, 0, w, h);
  return out;
}

function boxBlurGray(data: Float32Array, w: number, h: number, radius: number): Float32Array {
  if (radius < 1) return data;
  const tmp = new Float32Array(data.length);
  const out = new Float32Array(data.length);
  const win = radius * 2 + 1;
  for (let y = 0; y < h; y++) {           // أفقي
    let sum = 0;
    for (let x = -radius; x <= radius; x++) sum += data[y * w + Math.min(w - 1, Math.max(0, x))];
    for (let x = 0; x < w; x++) {
      tmp[y * w + x] = sum / win;
      sum -= data[y * w + Math.max(0, x - radius)];
      sum += data[y * w + Math.min(w - 1, x + radius + 1)];
    }
  }
  for (let x = 0; x < w; x++) {           // عمودي
    let sum = 0;
    for (let y = -radius; y <= radius; y++) sum += tmp[Math.min(h - 1, Math.max(0, y)) * w + x];
    for (let y = 0; y < h; y++) {
      out[y * w + x] = sum / win;
      sum -= tmp[Math.max(0, y - radius) * w + x];
      sum += tmp[Math.min(h - 1, y + radius + 1) * w + x];
    }
  }
  return out;
}

/** عتبة أوتسو: تفصل الحبر عن الورق بلا رقم ثابت */
function otsu(values: Float32Array): number {
  const hist = new Uint32Array(256);
  for (let i = 0; i < values.length; i++) hist[Math.max(0, Math.min(255, values[i] | 0))]++;
  const total = values.length;
  let sum = 0;
  for (let t = 0; t < 256; t++) sum += t * hist[t];
  let sumB = 0, wB = 0, best = 0, bestVar = -1;
  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;
    sumB += t * hist[t];
    const mB = sumB / wB, mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) * (mB - mF);
    if (between > bestVar) { bestVar = between; best = t; }
  }
  return best;
}

/**
 * يلحم الطباعة النقطية: تمويه بنصف قطر يتناسب مع حجم الصورة، ثم بنترة أوتسو.
 * النتيجة حروف مصمتة يقرأها المحرك بدل نقاط متناثرة.
 */
export function mergeDotMatrix(src: HTMLCanvasElement, radius = 1): HTMLCanvasElement {
  const ctx = src.getContext("2d", { willReadFrequently: true })!;
  const img = ctx.getImageData(0, 0, src.width, src.height);
  const px = img.data;
  const n = src.width * src.height;

  const gray = new Float32Array(n);
  for (let i = 0, j = 0; i < px.length; i += 4, j++) {
    gray[j] = px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114;
  }

  const blurred = boxBlurGray(gray, src.width, src.height, radius);
  const t = otsu(blurred);
  for (let j = 0, i = 0; j < n; j++, i += 4) {
    const v = blurred[j] <= t ? 0 : 255;
    px[i] = px[i + 1] = px[i + 2] = v;
  }
  ctx.putImageData(img, 0, 0);
  return src;
}

export function cloneCanvas(src: HTMLCanvasElement): HTMLCanvasElement {
  const out = document.createElement("canvas");
  out.width = src.width; out.height = src.height;
  out.getContext("2d", { willReadFrequently: true })!.drawImage(src, 0, 0);
  return out;
}
