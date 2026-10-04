/**
 * Rendering trace of the production build: totals main-thread time by
 * event type (style recalc, layout, paint, JS...) while idle on the hero
 * and while scrolling, plus which elements get repainted most.
 *
 * Usage: node scripts/trace.mjs [cpuThrottle=4]
 *        SECTION=.phone-track node scripts/trace.mjs   (trace one section)
 */
import { chromium } from 'playwright';

const THROTTLE = Number(process.argv[2] ?? 4);
const browser = await chromium.launch({
  channel: 'chrome',
  args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(process.env.URL ?? 'http://localhost:4173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);
const cdp = await page.context().newCDPSession(page);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: THROTTLE });

async function trace(label, run) {
  const events = [];
  cdp.on('Tracing.dataCollected', ({ value }) => events.push(...value));
  const done = new Promise((r) => cdp.once('Tracing.tracingComplete', r));
  await cdp.send('Tracing.start', {
    categories: 'devtools.timeline,disabled-by-default-devtools.timeline',
    transferMode: 'ReportEvents',
  });
  const t0 = Date.now();
  await run();
  const wall = Date.now() - t0;
  await cdp.send('Tracing.end');
  await done;
  cdp.removeAllListeners('Tracing.dataCollected');

  // Main thread = the one doing the most style/layout/paint work.
  const work = new Map();
  for (const e of events) {
    if (e.ph === 'X' && e.dur && /^(UpdateLayoutTree|Layout|Paint|FunctionCall)$/.test(e.name)) {
      work.set(e.tid, (work.get(e.tid) ?? 0) + e.dur);
    }
  }
  const main = [...work.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const totals = new Map();
  const paints = new Map();
  for (const e of events) {
    if (e.tid !== main || e.ph !== 'X' || !e.dur) continue;
    totals.set(e.name, (totals.get(e.name) ?? 0) + e.dur / 1000);
    if (e.name === 'Paint') {
      const c = e.args?.data?.clip;
      const key = c ? `${Math.round(c[2] - c[0])}x${Math.round(c[5] - c[1])}` : '?';
      paints.set(key, (paints.get(key) ?? 0) + e.dur / 1000);
    }
  }
  const pick = ['UpdateLayoutTree', 'Layout', 'PrePaint', 'Paint', 'Layerize', 'UpdateLayer', 'FunctionCall',
    'FireAnimationFrame', 'EventDispatch', 'HitTest', 'ScrollLayer', 'CompositeLayers', 'Commit', 'RunTask'];
  console.log(`\n=== ${label} (${wall} ms wall) ===`);
  for (const k of pick) if (totals.has(k)) console.log(`${k.padEnd(20)} ${totals.get(k).toFixed(0).padStart(6)} ms`);
  console.log('biggest paint areas:', [...paints.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)
    .map(([k, v]) => `${k}=${v.toFixed(0)}ms`).join('  '));
}

const only = process.env.SECTION;
if (only) {
  // Jump to the start of one section and trace a scroll through it.
  await page.evaluate((id) => {
    const el = document.getElementById(id) ?? document.querySelector(id);
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: 'instant' });
  }, only);
  await page.waitForTimeout(1500);
  await trace(`scrolling ${only}`, async () => {
    for (let i = 0; i < 40; i += 1) {
      await page.mouse.wheel(0, 120);
      await page.waitForTimeout(75);
    }
  });
} else {
  await trace('idle on hero', () => page.waitForTimeout(3000));
  await trace('scrolling', async () => {
    for (let i = 0; i < 40; i += 1) {
      await page.mouse.wheel(0, 120);
      await page.waitForTimeout(75);
    }
  });
}
await browser.close();
