import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const b=await chromium.launch(); const pg=await b.newPage({viewport:{width:512,height:512}});
await pg.goto('file://'+process.argv[2]); await pg.waitForTimeout(300);
await pg.screenshot({path:process.argv[3], omitBackground:true}); await b.close();
