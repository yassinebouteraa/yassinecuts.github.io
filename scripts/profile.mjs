/**
 * CPU profile of the production build (vite preview on :4173): idle on the
 * hero, then a scroll through the page. Prints the top self-time functions
 * and a main-thread breakdown, so hotspots are named rather than guessed.
 *
 * Usage: node scripts/profile.mjs [cpuThrottle=4]
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
await cdp.send('Profiler.enable');
await cdp.send('Profiler.setSamplingInterval', { interval: 200 });

async function profile(label, run) {
  await cdp.send('Profiler.start');
  await run();
  const { profile: prof } = await cdp.send('Profiler.stop');
  const dt = (prof.endTime - prof.startTime) / prof.samples.length;
  const self = new Map();
  const counts = new Map();
  prof.samples.forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1));
  for (const node of prof.nodes) {
    const c = counts.get(node.id) ?? 0;
    if (!c) continue;
    const f = node.callFrame;
    const file = f.url ? f.url.split('/').pop() : '';
    const key = `${f.functionName || '(anon)'} ${file}:${f.lineNumber}`;
    self.set(key, (self.get(key) ?? 0) + c * dt);
  }
  const total = [...self.values()].reduce((a, b) => a + b, 0);
  const idle = self.get('(idle) :-1') ?? 0;
  console.log(`\n=== ${label}: busy ${(((total - idle) / total) * 100).toFixed(0)}% of the time ===`);
  [...self.entries()]
    .filter(([k]) => !k.startsWith('(idle)'))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 18)
    .forEach(([k, v]) => console.log(`${((v / total) * 100).toFixed(1).padStart(5)}%  ${k}`));
}

await profile('idle on hero', () => page.waitForTimeout(4000));
await profile('scrolling', async () => {
  for (let i = 0; i < 60; i += 1) {
    await page.mouse.wheel(0, 120);
    await page.waitForTimeout(80);
  }
});
await browser.close();
