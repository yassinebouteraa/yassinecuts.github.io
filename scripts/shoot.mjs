/**
 * Drives the local dev server in installed Chrome, stops at every section,
 * and writes screenshots + a probe/console log to scripts/shots/.
 *
 * Usage: node scripts/shoot.mjs [width] [height] [url]
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const W = Number(process.argv[2] ?? 1440);
const H = Number(process.argv[3] ?? 900);
const URL = process.argv[4] ?? 'http://localhost:5173/';
const OUT = path.join(process.cwd(), 'scripts', 'shots', `page-${W}`);

const messages = [];

async function main() {
  await mkdir(OUT, { recursive: true });

  const browser = await chromium.launch({
    channel: 'chrome',
    args: ['--enable-unsafe-webgpu', '--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'],
  });
  const page = await browser.newPage({ viewport: { width: W, height: H } });

  page.on('console', (m) => messages.push(`[${m.type()}] ${m.text()}`));
  page.on('pageerror', (e) => messages.push(`[pageerror] ${e.message}`));
  page.on('requestfailed', (r) =>
    messages.push(`[requestfailed] ${r.url()} — ${r.failure()?.errorText}`)
  );

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(4000); // hero entrance, data fetch, GPU start-up

  // Report what actually rendered, so a missing section is obvious.
  const probe = await page.evaluate(() => {
    const seen = (sel) => Boolean(document.querySelector(sel));
    const count = (sel) => document.querySelectorAll(sel).length;
    return {
      documentHeight: document.body.scrollHeight,
      background: seen('.site-bg .site-bg-grain'),
      hero: seen('.hero'),
      heroPhoto: seen('.hero-photo-img'),
      craftCards: count('.craft-card'),
      phoneTrack: seen('.phone-track'),
      phoneCards: count('.phone-channel .video-card'),
      laptopTrack: seen('.laptop-track'),
      laptopCards: count('.laptop-channel .video-card'),
      emptyState: seen('#showreel .empty-state'),
      testimonials: count('#testimonials .video-card'),
      packages: count('.package-card'),
    };
  });
  await writeFile(path.join(OUT, 'probe.json'), JSON.stringify(probe, null, 2));

  // Close-up of the header so the logo can be checked at real size.
  await page.screenshot({ path: path.join(OUT, '00-header.png'), clip: { x: 0, y: 0, width: Math.min(W, 520), height: 90 } });

  // One stop per section, plus a couple inside the scroll-driven devices.
  const stops = await page.evaluate(() => {
    const top = (sel, off = 0) => {
      const el = document.querySelector(sel);
      return el ? Math.round(el.getBoundingClientRect().top + scrollY + off) : null;
    };
    const vh = innerHeight;
    return {
      hero: 0,
      craft: top('#craft'),
      phone: top('.phone-track', vh * 0.9),
      laptop: top('.laptop-track', vh * 0.9),
      testimonials: top('#testimonials'),
      packages: top('#packages'),
      contact: top('#contact'),
      bottom: document.body.scrollHeight,
    };
  });

  let i = 1;
  for (const [name, y] of Object.entries(stops)) {
    if (y == null) continue;
    await page.evaluate((t) => window.scrollTo({ top: t, behavior: 'instant' }), y);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(OUT, `${String(i++).padStart(2, '0')}-${name}.png`) });
  }

  await writeFile(path.join(OUT, 'console.log'), messages.join('\n') || '(no console output)');
  await browser.close();

  console.log(JSON.stringify(probe, null, 2));
  const errors = messages.filter((m) => /error|failed/i.test(m));
  console.log('\n--- errors ---\n' + (errors.join('\n') || '(clean)'));
}

main().catch((e) => {
  console.error('FAILED:', e);
  process.exit(1);
});
