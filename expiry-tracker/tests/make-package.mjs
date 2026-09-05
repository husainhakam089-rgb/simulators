// علبة بلا باركود: اسم عربي كبير + وزن + تاريخ — لتغذية كاميرا المتصفح
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
const OUT = process.argv[2];
const year = new Date().getFullYear() + 1;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const page = await browser.newPage();
const data = await page.evaluate(({ year }) => {
  const c = document.createElement('canvas');
  c.width = 1280; c.height = 720;
  const g = c.getContext('2d');
  g.fillStyle = '#d9482f'; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = '#f2ead6'; g.fillRect(60, 60, c.width - 120, c.height - 120);
  const grad = g.createLinearGradient(0, 0, c.width, c.height);
  grad.addColorStop(0, 'rgba(255,255,255,0.16)'); grad.addColorStop(1, 'rgba(0,0,0,0.14)');
  g.fillStyle = grad; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = '#171717'; g.textAlign = 'center';
  g.font = 'bold 64px "Noto Kufi Arabic", sans-serif';
  g.fillText('معجون طماطم الكاسر', c.width / 2, 230);
  g.font = 'bold 42px "Noto Kufi Arabic", sans-serif';
  g.fillText('صافي الوزن 800 غم', c.width / 2, 340);
  g.font = 'bold 40px monospace';
  g.fillText(`EXP 18/09/${year}`, c.width / 2, 470);
  g.fillText('LOT 4521A', c.width / 2, 545);
  const im = g.getImageData(0, 0, c.width, c.height);
  for (let i = 0; i < im.data.length; i += 4) { const n = (Math.random()-0.5)*12; im.data[i]+=n; im.data[i+1]+=n; im.data[i+2]+=n; }
  g.putImageData(im, 0, 0);
  return { png: c.toDataURL('image/png').split(',')[1], rgba: Array.from(im.data), w: c.width, h: c.height };
}, { year });

writeFileSync(OUT + '/package.png', Buffer.from(data.png, 'base64'));
const { rgba, w, h } = data;
const Y = Buffer.alloc(w*h), U = Buffer.alloc((w/2)*(h/2)), V = Buffer.alloc((w/2)*(h/2));
for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
  const i = (y*w+x)*4, r = rgba[i], gg = rgba[i+1], b = rgba[i+2];
  Y[y*w+x] = Math.max(16, Math.min(235, Math.round(0.257*r + 0.504*gg + 0.098*b + 16)));
  if (y % 2 === 0 && x % 2 === 0) {
    const ci = (y/2)*(w/2) + x/2;
    U[ci] = Math.max(16, Math.min(240, Math.round(-0.148*r - 0.291*gg + 0.439*b + 128)));
    V[ci] = Math.max(16, Math.min(240, Math.round(0.439*r - 0.368*gg - 0.071*b + 128)));
  }
}
const frame = Buffer.concat([Buffer.from('FRAME\n'), Y, U, V]);
writeFileSync(OUT + '/package.y4m', Buffer.concat([
  Buffer.from(`YUV4MPEG2 W${w} H${h} F15:1 Ip A1:1 C420mpeg2\n`), ...Array(12).fill(frame),
]));
console.log('package.png + package.y4m');
await browser.close();
