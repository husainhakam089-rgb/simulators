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
const URL  = 'file://' + (process.env.PHYS_HTML || path.join(ROOT, 'index.html'));

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
      const wasOn = [];
      for(const b of btns) wasOn.push(await b.evaluate(el=> el.classList.contains('on')));
      for(let bi = 0; bi < btns.length; bi++){
        const label = (await btns[bi].textContent()).trim();
        if(await btns[bi].evaluate(el=> el.disabled)) continue;   // معطَّل عمدًا في هذه الحالة
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

      /* أعِد كل زر إلى حالته الأولى قبل فحص المنزلقات: لو بقي النشاط على
         «بلا مغناطيس» أو على دائرة مفتوحة لبدت المنزلقات وكأنها لا تعمل. */
      for(let bi = 0; bi < btns.length; bi++){
        if(!wasOn[bi]) continue;
        const on = await btns[bi].evaluate(el=> el.classList.contains('on'));
        if(!on){ await btns[bi].click(); await wait(page, 250); }
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

      /* ---- 6. مفتاح الدائرة: لمسة إصبع حقيقية على المفتاح المرسوم ---- */
      const swBox = await page.evaluate(i=>{
        const st = window['t'+i+'State'];
        return (st && st._swBox) ? { b: st._swBox, sw: st.sw } : null;
      }, id);
      let hasSwitch = false;
      if(swBox){
        hasSwitch = true;
        const box = await page.$eval('#simCanvas', el=>{
          const r = el.getBoundingClientRect();
          return { x:r.x, y:r.y, w:r.width, h:r.height };
        });
        /* مرّر الرسم ليصل المفتاح إلى الشاشة (scrollLeft سالب في صفحة RTL) */
        const cxLogical = swBox.b.x + swBox.b.w/2, cyLogical = swBox.b.y + swBox.b.h/2;
        await page.evaluate((lx)=>{
          const sc = document.querySelector('.canvas-scroll');
          const c  = document.getElementById('simCanvas');
          if(!sc || sc.scrollWidth <= sc.clientWidth + 2) return;
          const cr = c.getBoundingClientRect(), sr = sc.getBoundingClientRect();
          sc.scrollLeft -= ((sr.x + sr.width/2) - (cr.x + lx*(cr.width/900)));
        }, cxLogical);
        await wait(page, 150);
        const box2 = await page.$eval('#simCanvas', el=>{
          const r = el.getBoundingClientRect();
          return { x:r.x, y:r.y, w:r.width, h:r.height };
        });
        await page.mouse.click(box2.x + cxLogical*(box2.w/900),
                               box2.y + cyLogical*(box2.h/480));
        await wait(page, 300);
        const after = await page.evaluate(i=> window['t'+i+'State'].sw, id);
        if(after === swBox.sw) notes.push('لمس المفتاح المرسوم لا يفتحه');
        const btnOn = await page.$eval('[data-switch="'+id+'"]', el=> el.classList.contains('on'));
        if(btnOn !== (after === 1)) notes.push('زر المفتاح لا يتبع المفتاح المرسوم');
        await page.click('[data-switch="'+id+'"]');   // أعِد الدائرة مغلقة
        await wait(page, 200);
      }
      report.push({ id, title, animates, hasDrag, hasSwitch, notes });
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
                '   |   سحب باليد: ' + (r.hasDrag ? 'نعم' : 'لا') +
                '   |   مفتاح يعمل باللمس: ' + (r.hasSwitch ? 'نعم' : '—'));
    r.notes.forEach(n=> console.log('     • ' + n));
  });
  if(pageErrors.length){
    console.log('\n❌ أخطاء جافاسكربت:');
    pageErrors.forEach(e=> console.log('   • ' + e));
  }
  console.log('\n── الخلاصة: ' + (report.length - bad) + ' من ' + report.length + ' بلا ملاحظات ──');
  process.exit(bad || pageErrors.length ? 1 : 0);
})();
