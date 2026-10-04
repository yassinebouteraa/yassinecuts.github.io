/** Background on its own (content hidden). node scripts/shoot-bgonly.mjs [w] [h] */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
const W = Number(process.argv[2] ?? 900), H = Number(process.argv[3] ?? 900);
await mkdir('scripts/shots/bgonly', { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.addStyleTag({ content: 'body > #root > *:not(.site-bg){visibility:hidden!important} .site-bg{visibility:visible!important}' });
for (const t of [0, 6000, 12000]) {
  await page.waitForTimeout(t ? 6000 : 1500);
  await page.screenshot({ path: `scripts/shots/bgonly/${W}x${H}-t${t / 1000}.png` });
}
await browser.close();
