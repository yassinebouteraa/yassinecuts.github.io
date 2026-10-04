/**
 * Screenshots the showreel section only: walks the phone track and the TV
 * track at fixed fractions so flips / glitches are caught mid-motion.
 * Usage: node scripts/shoot-reel.mjs [width] [height]
 */
import { chromium } from 'playwright';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';

const W = Number(process.argv[2] ?? 1440);
const H = Number(process.argv[3] ?? 900);
const OUT = path.join(process.cwd(), 'scripts', 'shots', `reel-${W}`);
const log = [];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
page.on('pageerror', (e) => log.push(`[pageerror] ${e.message}`));
page.on('console', (m) => m.type() === 'error' && log.push(`[error] ${m.text()}`));
await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(2500);

const tracks = await page.evaluate(() =>
  ['.phone-track', '.laptop-track'].map((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { sel, top: r.top + scrollY, height: r.height };
  })
);
console.log(tracks);

let n = 0;
async function shot(y, label, wait = 700) {
  await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), Math.round(y));
  await page.waitForTimeout(wait);
  await page.screenshot({ path: path.join(OUT, `${String(n++).padStart(2, '0')}-${label}.png`) });
}

const stops = JSON.parse(process.env.STOPS ?? 'null');
for (const t of tracks.filter(Boolean)) {
  const name = t.sel.slice(1, -6);
  // approach (track top entering from below)
  await shot(t.top - H * 0.55, `${name}-approach`);
  const span = t.height - H;
  for (const f of stops ?? [0.02, 0.1, 0.125, 0.135, 0.3, 0.5, 0.97]) {
    await shot(t.top + span * f, `${name}-p${Math.round(f * 1000)}`, Number(process.env.WAIT ?? (name === 'tv' && f > 0.3 ? 120 : 700)));
  }
}
await writeFile(path.join(OUT, 'log.txt'), log.join('\n') || '(clean)');
console.log(log.join('\n') || '(clean)');
await browser.close();
