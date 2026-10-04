import { useEffect, useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';

/**
 * Film-stock backdrop fixed behind the WHOLE site, matched to the brand
 * reference: a warm amber wash pouring down from the top with a glowing rim
 * along its lower-left edge, a near-black plum lower half, a faint ember in
 * the bottom-right corner, all under live film grain and dust.
 *
 * The glows are plain CSS gradients animated on transform/opacity only (cheap,
 * GPU-composited, no blur filters). Grain and dust share one small canvas that
 * redraws at film-ish 12fps from a few pre-rendered noise tiles, so the cost
 * per frame is a couple of pattern fills, not per-pixel work.
 *
 * Below the hero a dark scrim fades in over it, so section text and the
 * showreel videos stay readable while the light keeps moving underneath.
 */
export function HeroBackground() {
  const { scrollY } = useScroll();
  const scrimOpacity = useTransform(scrollY, [0, 700], [0, 1]);

  return (
    <>
      <div className="site-bg" aria-hidden="true">
        <div className="site-bg-glow site-bg-wash" />
        <div className="site-bg-glow site-bg-hotspot" />
        <div className="site-bg-leak" />
        <div className="site-bg-glow site-bg-flare" />
        <div className="site-bg-glow site-bg-corner" />
        <div className="site-bg-vignette" />
        <FilmGrain />
      </div>
      <motion.div className="site-bg-scrim" aria-hidden="true" style={{ opacity: scrimOpacity }} />
    </>
  );
}

const TILE = 256;
const TILE_COUNT = 4;
const FPS = 12;
const DUST_COUNT = 34;
const GRAIN_SCALE = 0.5;

function makeNoiseTile() {
  const c = document.createElement('canvas');
  c.width = c.height = TILE;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(TILE, TILE);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

function makeDust(w, h) {
  return Array.from({ length: DUST_COUNT }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    r: Math.random() < 0.85 ? 0.6 + Math.random() * 1.1 : 1.6 + Math.random() * 1.4,
    a: 0.15 + Math.random() * 0.45,
    vx: (Math.random() - 0.5) * 0.25,
    vy: -0.05 - Math.random() * 0.2,
  }));
}

function FilmGrain() {
  const ref = useRef(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    const tiles = Array.from({ length: TILE_COUNT }, () => ctx.createPattern(makeNoiseTile(), 'repeat'));
    let w = 0;
    let h = 0;
    let dust = [];

    // Drawn at half resolution and scaled up by CSS: a quarter of the pixels
    // to fill every frame, and the grain reads as film grain either way.
    // Dust is positioned in CSS pixels through a matching transform.
    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.ceil(w * GRAIN_SCALE);
      canvas.height = Math.ceil(h * GRAIN_SCALE);
      dust = makeDust(w, h);
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Grain: a random tile at a random offset each frame.
      ctx.globalAlpha = 0.07;
      ctx.translate(-Math.random() * TILE, -Math.random() * TILE);
      ctx.fillStyle = tiles[(Math.random() * TILE_COUNT) | 0];
      ctx.fillRect(0, 0, canvas.width + TILE, canvas.height + TILE);

      ctx.setTransform(GRAIN_SCALE, 0, 0, GRAIN_SCALE, 0, 0);

      // Dust: slow drifting specks that flicker like dirt on a print.
      ctx.fillStyle = '#F1ECE4';
      for (const d of dust) {
        d.x = (d.x + d.vx + w) % w;
        d.y = (d.y + d.vy + h) % h;
        if (Math.random() < 0.12) continue;
        ctx.globalAlpha = d.a * (0.6 + Math.random() * 0.4);
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // The odd hair-thin scratch that lives for a single frame.
      if (Math.random() < 0.18) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const len = 10 + Math.random() * 40;
        const ang = Math.random() * Math.PI;
        ctx.globalAlpha = 0.18 + Math.random() * 0.25;
        ctx.strokeStyle = '#F1ECE4';
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + len * 0.5, y + (Math.random() - 0.5) * 8, x + Math.cos(ang) * len, y + Math.sin(ang) * len);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };

    draw();
    if (reduced) {
      return () => window.removeEventListener('resize', resize);
    }

    // A 12fps timer that asks for exactly one frame per grain update. An
    // always-on requestAnimationFrame loop (even one that skipped most
    // frames) woke the whole rendering pipeline 60 times a second.
    let raf = 0;
    let timer = 0;
    const schedule = () => {
      timer = window.setTimeout(() => {
        raf = requestAnimationFrame(() => {
          draw();
          schedule();
        });
      }, 1000 / FPS);
    };
    schedule();

    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [reduced]);

  return <canvas ref={ref} className="site-bg-grain" />;
}
