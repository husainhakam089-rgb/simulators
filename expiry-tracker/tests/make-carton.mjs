// يرسم كارتوناً واقعياً: باركود EAN-13 صحيح + تاريخ انتهاء مطبوع، ويحفظه PNG
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const OUT = process.argv[2];
const year = new Date().getFullYear() + 1;

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const page = await browser.newPage();
const png = await page.evaluate(({ year }) => {
  const L = ['0001101','0011001','0010011','0111101','0100011','0110001','0101111','0111011','0110111','0001011'];
  const G = ['0100111','0110011','0011011','0100001','0011101','0111001','0000101','0010001','0001001','0010111'];
  const R = ['1110010','1100110','1101100','1000010','1011100','1001110','1010000','1000100','1001000','1110100'];
  const PARITY = ['LLLLLL','LLGLGG','LLGGLG','LLGGGL','LGLLGG','LGGLLG','LGGGLL','LGLGLG','LGLGGL','LGGLGL'];

  const encodeEAN13 = (code) => {
    const d = code.split('').map(Number);
    let bits = '101';
    const parity = PARITY[d[0]];
    for (let i = 1; i <= 6; i++) bits += (parity[i-1] === 'L' ? L : G)[d[i]];
    bits += '01010';
    for (let i = 7; i <= 12; i++) bits += R[d[i]];
    return bits + '101';
  };

  const c = document.createElement('canvas');
  c.width = 1280; c.height = 720;
  const g = c.getContext('2d');

  // كرتون بلون طبيعي وتدرّج إضاءة
  g.fillStyle = '#c8a97c'; g.fillRect(0, 0, c.width, c.height);
  const grad = g.createLinearGradient(0, 0, c.width, c.height);
  grad.addColorStop(0, 'rgba(255,255,255,0.20)');
  grad.addColorStop(1, 'rgba(0,0,0,0.18)');
  g.fillStyle = grad; g.fillRect(0, 0, c.width, c.height);

  // ملصق أبيض عليه الباركود
  const bx = 380, by = 120, bw = 520, bh = 250;
  g.fillStyle = '#fff'; g.fillRect(bx, by, bw, bh);
  const bits = encodeEAN13('6281000012345');
  const mod = (bw - 40) / bits.length;
  g.fillStyle = '#000';
  for (let i = 0; i < bits.length; i++) {
    if (bits[i] === '1') g.fillRect(bx + 20 + i * mod, by + 20, Math.ceil(mod), 170);
  }
  g.font = 'bold 30px monospace'; g.textAlign = 'center';
  g.fillText('6 281000 012345', bx + bw / 2, by + 232);

  // التاريخ مطبوع على الكرتون نفسه، كما تفعل المصانع
  g.fillStyle = '#1c1c1c';
  g.font = 'bold 46px monospace'; g.textAlign = 'center';
  g.fillText('LOT 4521A', c.width / 2, 480);
  g.fillText(`EXP ${25}/12/${year}`, c.width / 2, 560);

  // ضجيج خفيف كصورة كاميرا حقيقية
  const img = g.getImageData(0, 0, c.width, c.height);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 14;
    img.data[i] += n; img.data[i+1] += n; img.data[i+2] += n;
  }
  g.putImageData(img, 0, 0);

  const raw = g.getImageData(0, 0, c.width, c.height).data;
  return { png: c.toDataURL('image/png').split(',')[1], rgba: Array.from(raw), w: c.width, h: c.height };
}, { year });

writeFileSync(OUT + '/carton.png', Buffer.from(png.png, 'base64'));

// Y4M مباشرة: ffmpeg المرفق مع Playwright لا يفكّ ترميز PNG
const { rgba, w, h } = png;
const ySize = w * h, cSize = (w / 2) * (h / 2);
const Y = Buffer.alloc(ySize), U = Buffer.alloc(cSize), V = Buffer.alloc(cSize);
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    const r = rgba[i], gg = rgba[i + 1], b = rgba[i + 2];
    Y[y * w + x] = Math.max(16, Math.min(235, Math.round(0.257 * r + 0.504 * gg + 0.098 * b + 16)));
    if (y % 2 === 0 && x % 2 === 0) {
      const ci = (y / 2) * (w / 2) + x / 2;
      U[ci] = Math.max(16, Math.min(240, Math.round(-0.148 * r - 0.291 * gg + 0.439 * b + 128)));
      V[ci] = Math.max(16, Math.min(240, Math.round(0.439 * r - 0.368 * gg - 0.071 * b + 128)));
    }
  }
}
const frame = Buffer.concat([Buffer.from('FRAME\n'), Y, U, V]);
const frames = [];
for (let i = 0; i < 12; i++) frames.push(frame);
writeFileSync(OUT + '/carton.y4m', Buffer.concat([
  Buffer.from(`YUV4MPEG2 W${w} H${h} F15:1 Ip A1:1 C420mpeg2\n`), ...frames,
]));
console.log('carton.png + carton.y4m');
await browser.close();
