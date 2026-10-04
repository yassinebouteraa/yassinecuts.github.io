/** Screenshots the laptop opening as it scrolls in. node scripts/shoot-laptop.mjs [w] [h] */
import { chromium } from 'playwright';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
const W = Number(process.argv[2] ?? 1440), H = Number(process.argv[3] ?? 900);
const OUT = path.join(process.cwd(), 'scripts', 'shots', `laptop-${W}`);
await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
const t = await page.evaluate(() => { const r = document.querySelector('.laptop-track').getBoundingClientRect(); return { top: r.top + scrollY, h: r.height }; });
const stops = [['a40', t.top - H * 0.6], ['a65', t.top - H * 0.35], ['a85', t.top - H * 0.15], ['p05', t.top + (t.h - H) * 0.05], ['p60', t.top + (t.h - H) * 0.6]];
for (const [name, y] of stops) {
  await page.evaluate((top) => scrollTo({ top, behavior: 'instant' }), Math.round(y));
  await page.waitForTimeout(2200);
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
}
await browser.close();
