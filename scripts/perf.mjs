/**
 * Smoothness benchmark. Opens the site in installed Chrome with the CPU
 * throttled (default 4x, roughly a mid-range laptop), sits idle on the hero,
 * then scrolls the whole page at a steady pace while recording every frame.
 * Prints FPS and dropped-frame stats overall and per section.
 *
 * Usage: node scripts/perf.mjs [cpuThrottle=4] [label]
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const THROTTLE = Number(process.argv[2] ?? 4);
const LABEL = process.argv[3] ?? 'run';

const browser = await chromium.launch({
  channel: 'chrome',
  args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(process.env.URL ?? 'http://localhost:4173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);

const cdp = await page.context().newCDPSession(page);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: THROTTLE });

// Frame recorder: logs each rAF delta with the section in the middle of the screen.
await page.evaluate(() => {
  window.__frames = [];
  let last = performance.now();
  const ids = ['craft', 'showreel', 'testimonials', 'packages', 'contact'];
  const sectionAt = () => {
    const mid = innerHeight / 2;
    for (let i = ids.length - 1; i >= 0; i -= 1) {
      const el = document.getElementById(ids[i]);
      if (el && el.getBoundingClientRect().top < mid) return ids[i];
    }
    return 'hero';
  };
  const tick = (now) => {
    window.__frames.push([now - last, window.__phase ?? 'idle', sectionAt()]);
    last = now;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});

// 1. Idle on the hero: the cost of the always-on background, grain, etc.
await page.evaluate(() => (window.__phase = 'idle'));
await page.waitForTimeout(4000);

// 2. Steady scroll through the whole page (~1500px/s, like a brisk wheel).
await page.evaluate(() => (window.__phase = 'scroll'));
const height = await page.evaluate(() => document.body.scrollHeight - innerHeight);
for (let y = 0; y < height; y += 120) {
  await page.mouse.wheel(0, 120);
  await page.waitForTimeout(80);
}
await page.waitForTimeout(500);

const frames = await page.evaluate(() => window.__frames);
await browser.close();

const stats = (list) => {
  const d = list.map((f) => f[0]).filter((v) => v > 0 && v < 1000);
  if (!d.length) return null;
  const total = d.reduce((a, b) => a + b, 0);
  const sorted = [...d].sort((a, b) => a - b);
  return {
    fps: +(1000 / (total / d.length)).toFixed(1),
    p95ms: +sorted[Math.floor(sorted.length * 0.95)].toFixed(1),
    janky: `${((d.filter((v) => v > 34).length / d.length) * 100).toFixed(1)}%`,
    frames: d.length,
  };
};

const report = { throttle: `${THROTTLE}x`, idleHero: stats(frames.filter((f) => f[1] === 'idle')) };
const scroll = frames.filter((f) => f[1] === 'scroll');
report.scrollAll = stats(scroll);
for (const s of ['hero', 'craft', 'showreel', 'testimonials', 'packages', 'contact']) {
  report[`scroll:${s}`] = stats(scroll.filter((f) => f[2] === s));
}

await mkdir('scripts/shots/perf', { recursive: true });
await writeFile(`scripts/shots/perf/${LABEL}.json`, JSON.stringify(report, null, 2));
console.table(
  Object.fromEntries(Object.entries(report).filter(([, v]) => v && typeof v === 'object'))
);
