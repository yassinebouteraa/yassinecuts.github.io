/**
 * Films the scroll choreography: hero intro over time, then fine scroll
 * steps through a giant title, the pinned Craft stepper and the contact
 * portal. Writes frames + contact sheets to scripts/shots/anim-<w>/.
 *
 * Usage: node scripts/shoot-anim.mjs [width] [height]
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const W = Number(process.argv[2] ?? 1440);
const H = Number(process.argv[3] ?? 900);
const OUT = `scripts/shots/anim-${W}`;
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

await page.goto('http://localhost:5173/', { waitUntil: 'commit' });
let last = 0;
for (const t of [600, 800, 1000, 1200, 1500, 2800]) {
  await page.waitForTimeout(t - last);
  last = t;
  await page.screenshot({ path: `${OUT}/intro-${t}.png` });
}
await page.waitForLoadState('networkidle');
// Reviews and package images shift the layout as they load; let it settle.
await page.waitForTimeout(3000);

const scrollTo = async (y) => {
  await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);
  await page.waitForTimeout(900);
};
const topOf = (sel) =>
  page.evaluate((s) => {
    const el = document.querySelector(s);
    return el ? el.getBoundingClientRect().top + window.scrollY : null;
  }, sel);

const titleTop = await topOf('.big-title-track');
for (const f of [-0.6, -0.3, 0, 0.3, 0.55, 0.8, 1.05]) {
  await scrollTo(Math.round(titleTop + f * H));
  await page.screenshot({ path: `${OUT}/title-${f}.png` });
}

// Scroll to a fraction of a section's pinned travel. Measures right before
// each step (and corrects once) because lazy images shift the layout.
const scrollIn = async (sel, f) => {
  for (let pass = 0; pass < 2; pass += 1) {
    await page.evaluate(
      ([s, frac]) => {
        const el = document.querySelector(s);
        const top = el.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: top + frac * (el.offsetHeight - window.innerHeight), behavior: 'instant' });
      },
      [sel, f]
    );
    await page.waitForTimeout(pass === 0 ? 400 : 900);
  }
};

for (const f of [0, 0.2, 0.45, 0.7, 0.95]) {
  await scrollIn('#craft', f);
  await page.screenshot({ path: `${OUT}/craft-${f}.png` });
}

for (const f of [0, 0.12, 0.22, 0.32, 0.42, 0.5, 0.58, 0.68, 0.85]) {
  await scrollIn('#contact', f);
  await page.screenshot({ path: `${OUT}/contact-${f}.png` });
}

await browser.close();
console.log(errors.length ? errors.join('\n') : '(no errors)');
