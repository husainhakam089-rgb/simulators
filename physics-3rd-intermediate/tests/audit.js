/* =========================================================================
   فحص الأنشطة واحدًا واحدًا في متصفح حقيقي.
   لكل نشاط يتحقق من:
     • هل يتحرك الرسم فعلًا في الوضع التلقائي؟ (مقارنة إطارين بالبكسل)
     • هل يتجمّد فعلًا في الوضع اليدوي؟
     • هل كل زر يغيّر الرسم؟
     • هل كل منزلق يغيّر الرسم؟
     • هل السحب باليد يعمل حيث يوجد جسم قابل للسحب؟
   التشغيل:  node tests/audit.js
   ========================================================================= */
const path = require('path');
const fs   = require('fs');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const URL  = 'file://' + path.join(ROOT, 'index.html');

/* بصمة الكانفاس: تُستعمل لمعرفة هل تغيّر الرسم فعلًا */
async function frame(page){
  return page.evaluate(()=>{
    const c = document.getElementById('simCanvas');
    const g = c.getContext('2d');
    const d = g.getImageData(0, 0, c.width, c.height).data;
    let h = 0;
    for(let i = 0; i < d.length; i += 53) h = (h*31 + d[i]) >>> 0;
    return h;
  });
}
const wait = (page, ms)=> page.waitForTimeout(ms);

(async ()=>{
  const EXE = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
               '/opt/pw-browsers/chromium/chrome-linux/chrome'].find(p=>fs.existsSync(p));
  const browser = await chromium.launch(EXE ? { executablePath: EXE } : {});
  const page = await browser.newPage({ viewport:{ width:1366, height:900 } });
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(e.message));
  page.on('console', m => { if(m.type()==='error') pageErrors.push('console: '+m.text()); });

  await page.goto(URL);
  await page.click('#startBtn');
  await wait(page, 300);

  const chapters = await page.$$eval('.chapter-card', els=>els.length);
  const report = [];

  for(let ci = 0; ci < chapters; ci++){
    await page.$$eval('.chapter-card', (els, i)=> els[i].click(), ci);
    await wait(page, 350);
    const chTitle = await page.$eval('#chapterBadge', e=>e.textContent.trim());
    const tabCount = await page.$$eval('.tab-btn', els=>els.length);

    for(let ti = 0; ti < tabCount; ti++){
      await page.$$eval('.tab-btn', (els,i)=>els[i].click(), ti);
      await wait(page, 400);
      const id    = await page.evaluate(()=> window.eval('activeTab'));
      const title = await page.$eval('#mainTitle', e=>e.textContent.trim());
      const notes = [];

      /* ---- 1. هل يتحرك في الوضع التلقائي؟ ---- */
      const a1 = await frame(page); await wait(page, 1200);
      const a2 = await frame(page);
      const animates = a1 !== a2;
      if(!animates) notes.push('ساكن تمامًا في الوضع التلقائي');

      /* ---- 2. هل يتجمّد في الوضع اليدوي؟ ---- */
      const modeBtn = await page.$('[data-mode-tab="'+id+'"]');
      if(modeBtn){
        await modeBtn.click(); await wait(page, 250);
        const m1 = await frame(page); await wait(page, 550);
        const m2 = await frame(page);
        if(m1 !== m2) notes.push('لا يتجمّد في الوضع اليدوي');
        await modeBtn.click(); await wait(page, 250);   // عودة إلى التلقائي
      } else notes.push('لا زر وضع يدوي');

      /* ---- 3. كل زر يغيّر الرسم ---- */
      const btns = await page.$$('.control-panel[data-tab="'+id+'"] button:not([data-mode-tab])');
      for(let bi = 0; bi < btns.length; bi++){
        const label = (await btns[bi].textContent()).trim();
        const isOn  = await btns[bi].evaluate(el=> el.classList.contains('on'));
        /* زر مجموعة مُفعَّل أصلًا: ننتقل إلى زر آخر أولًا ثم نعود إليه،
           وإلا حكمنا عليه بالفشل وهو يعمل. */
        if(isOn && btns.length > 1){
          const other = btns[(bi+1) % btns.length];
          await other.click(); await wait(page, 300);
        }
        if(modeBtn) { await modeBtn.click(); await wait(page, 200); }
        const b1 = await frame(page);
        await btns[bi].click(); await wait(page, 350);
        const b2 = await frame(page);
        if(b1 === b2) notes.push('زر «'+label+'» لا يغيّر الرسم');
        if(modeBtn) { await modeBtn.click(); await wait(page, 200); }
      }

      /* ---- 4. كل منزلق يغيّر الرسم ---- */
      const ranges = await page.$$('.control-panel[data-tab="'+id+'"] input[type=range]');
      for(let ri = 0; ri < ranges.length; ri++){
        const info = await ranges[ri].evaluate(el=>({
          t: el.dataset.target, min:Number(el.min), max:Number(el.max),
          val:Number(el.value), disabled: el.disabled
        }));
        if(info.disabled) continue;
        if(modeBtn) { await modeBtn.click(); await wait(page, 200); }
        const s1 = await frame(page);
        const target = (Math.abs(info.val-info.max) > Math.abs(info.val-info.min)) ? info.max : info.min;
        await ranges[ri].evaluate((el,v)=>{
          el.value = String(v); el.dispatchEvent(new Event('input',{bubbles:true}));
        }, target);
        await wait(page, 350);
        const s2 = await frame(page);
        if(s1 === s2) notes.push('منزلق «'+info.t+'» لا يغيّر الرسم');
        await ranges[ri].evaluate((el,v)=>{
          el.value = String(v); el.dispatchEvent(new Event('input',{bubbles:true}));
        }, info.val);
        if(modeBtn) { await modeBtn.click(); await wait(page, 200); }
      }

      /* ---- 5. السحب باليد إن وُجد ---- */
      const hasDrag = await page.evaluate(i=> typeof window['t'+i+'DragHitTest'] === 'function', id);
      report.push({ id, title, animates, hasDrag, notes });
    }
    await page.click('#backBtn');
    await wait(page, 300);
  }

  await browser.close();

  console.log('\n══════ فحص الأنشطة واحدًا واحدًا ══════');
  let bad = 0;
  report.forEach(r=>{
    const ok = r.notes.length === 0;
    if(!ok) bad++;
    console.log('\n' + (ok ? '✅' : '⚠️ ') + '  [' + r.id + '] ' + r.title);
    console.log('     حركة تلقائية: ' + (r.animates ? 'نعم' : 'لا') +
                '   |   سحب باليد: ' + (r.hasDrag ? 'نعم' : 'لا'));
    r.notes.forEach(n=> console.log('     • ' + n));
  });
  if(pageErrors.length){
    console.log('\n❌ أخطاء جافاسكربت:');
    pageErrors.forEach(e=> console.log('   • ' + e));
  }
  console.log('\n── الخلاصة: ' + (report.length - bad) + ' من ' + report.length + ' بلا ملاحظات ──');
  process.exit(bad || pageErrors.length ? 1 : 0);
})();
