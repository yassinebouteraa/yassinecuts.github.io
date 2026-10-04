/**
 * Regenerates the README screenshots in docs/screenshots/ from a running
 * build: the landing page, plus a strip of three signature moments (the
 * Craft timeline, the phone showreel and the contact reveal).
 *
 * Usage: npm run build && npm run preview   (in another terminal)
 *        node scripts/shoot-readme.mjs [url=http://localhost:4173/]
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const URL = process.argv[2] ?? 'http://localhost:4173/';
const OUT = 'docs/screenshots';
const JPG = { type: 'jpeg', quality: 86 };
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(3500); // intro: playhead sweep, focus brackets, REC light

await page.screenshot({ path: `${OUT}/landing.jpg`, ...JPG });

// Scroll to a fraction of a section's pinned travel, measuring right before
// each shot because lazy images shift the layout as they load.
const scrollIn = async (sel, f, extra = 0) => {
  for (let pass = 0; pass < 2; pass += 1) {
    await page.evaluate(
      ([s, frac, add]) => {
        const el = document.querySelector(s);
        const top = el.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: top + frac * (el.offsetHeight - window.innerHeight) + add, behavior: 'instant' });
      },
      [sel, f, extra]
    );
    await page.waitForTimeout(pass === 0 ? 600 : 1600);
  }
};

await scrollIn('#craft', 0.45);
await page.screenshot({ path: `${OUT}/craft.jpg`, ...JPG });

await scrollIn('.phone-track', 0, 900 * 0.9);
await page.screenshot({ path: `${OUT}/showreel.jpg`, ...JPG });

await scrollIn('#contact', 0.92);
await page.screenshot({ path: `${OUT}/contact.jpg`, ...JPG });

await browser.close();
console.log(`Saved to ${OUT}/`);
