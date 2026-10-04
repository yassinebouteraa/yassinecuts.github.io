/**
 * Clicks play on the phone and the TV and screenshots the "watching mode"
 * transition, and reports the player's layout size vs its on-screen size
 * (equal = shown 1:1, no upscaling blur).
 * Usage: node scripts/test-phone-play.mjs [width] [height]
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const W = Number(process.argv[2] ?? 1440);
const H = Number(process.argv[3] ?? 900);
const OUT = path.join(process.cwd(), 'scripts', 'shots', `play-${W}`);
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);

const shot = (name) => page.screenshot({ path: path.join(OUT, `${name}.png`) });

for (const device of ['phone', 'laptop']) {
  const t = await page.evaluate((sel) => {
    const r = document.querySelector(sel).getBoundingClientRect();
    return { top: r.top + scrollY, h: r.height };
  }, `.${device}-track`);
  await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), t.top + (t.h - H) * 0.03);
  await page.waitForTimeout(2500);
  await shot(`${device}-0-rest`);

  await page.click(`.${device}-channel .video-poster`, { force: true });
  await page.waitForTimeout(400);
  await shot(`${device}-1-mid`);
  await page.waitForTimeout(2200);
  await shot(`${device}-2-watching`);
  console.log(
    device,
    await page.evaluate((d) => {
      const f = document.querySelector(`.${d}-channel iframe`);
      if (!f) return 'no iframe';
      const r = f.getBoundingClientRect();
      return {
        layout: `${f.offsetWidth}x${f.offsetHeight}`,
        onScreen: `${Math.round(r.width)}x${Math.round(r.height)}`,
        watching: !!document.querySelector(`.${d}-sticky.is-watching`),
      };
    }, device)
  );

  await page.keyboard.press('Escape');
  await page.waitForTimeout(2200);
  await shot(`${device}-3-closed`);
}
await browser.close();
