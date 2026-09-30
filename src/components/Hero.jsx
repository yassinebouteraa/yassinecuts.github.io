import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useSpring, useReducedMotion } from 'motion/react';
import { ArrowDown, Briefcase, Layers } from 'lucide-react';

import { useModal } from '../context/ModalContext.jsx';
import { useMediaQuery } from '../hooks/useMediaQuery.js';
import { HeroBackground } from './HeroBackground.jsx';
import { MagneticButton } from './motion/MagneticButton.jsx';
import { EASE } from './motion/variants.js';

// Above the fold, so the hero animates on mount rather than on scroll.
// Everything rises through the same curve, staged element by element.
// With reduced motion the props drop out entirely and it renders static.
const rise = (delay, reduced, distance = 26) =>
  reduced
    ? {}
    : {
        initial: { opacity: 0, y: distance },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.8, ease: EASE, delay },
      };

const STATS = [
  { value: '50+', label: 'Projects Edited' },
  { value: '10M+', label: 'Views Generated' },
  { value: '100%', label: 'Client Satisfaction' },
];

const TIMECODE_FPS = 24;
const pad2 = (n) => String(n).padStart(2, '0');

/** A fake-but-alive timecode readout for the HUD corner — pure set dressing. */
function useTimecode(reduced) {
  const [frameCount, setFrameCount] = useState(0);

  useEffect(() => {
    if (reduced) return undefined;
    const id = window.setInterval(() => setFrameCount((f) => f + 1), 1000 / TIMECODE_FPS);
    return () => window.clearInterval(id);
  }, [reduced]);

  if (reduced) return '00:00:00:00';

  const totalSeconds = Math.floor(frameCount / TIMECODE_FPS);
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const seconds = totalSeconds % 60;
  const frames = frameCount % TIMECODE_FPS;
  return `00:${pad2(minutes)}:${pad2(seconds)}:${pad2(frames)}`;
}

export function Hero() {
  const { openModal } = useModal();
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const isMobile = useMediaQuery('(max-width: 900px)');
  const timecode = useTimecode(reduced);

  // The copy and the photo drift at slightly different rates as the shard
  // field scrolls past behind them — cheap parallax depth, text leads.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });
  const smooth = useSpring(scrollYProgress, { stiffness: 90, damping: 30, restDelta: 0.001 });
  const contentY = useTransform(smooth, [0, 1], [0, isMobile ? 0 : 70]);
  const contentOpacity = useTransform(smooth, [0, 0.7], [1, isMobile ? 1 : 0]);
  const photoY = useTransform(smooth, [0, 1], [0, isMobile ? 0 : 30]);

  return (
    <section className="hero" ref={ref}>
      <HeroBackground />
      <div className="hero-scrim-left" aria-hidden="true" />
      <div className="hero-fade" aria-hidden="true" />

      {/* Viewfinder HUD — the frame lines, brand mark and timecode readout
          that give the hero a camera-monitor feel rather than a plain banner. */}
      <div className="hero-hud" aria-hidden="true">
        <motion.div className="hero-hud-corner hero-hud-corner-tl" {...rise(0.1, reduced, 14)}>
          <span className="hero-hud-bracket" />
          <span className="hero-hud-text">YB — VIDEO EDITOR</span>
        </motion.div>
        <motion.div className="hero-hud-corner hero-hud-corner-br" {...rise(0.1, reduced, 14)}>
          <span className="hero-hud-text hero-hud-text-mono">{timecode}</span>
          <span className="hero-hud-bracket" />
        </motion.div>
      </div>

      <div className="hero-inner">
        <motion.div
          className="hero-content"
          style={reduced ? undefined : { y: contentY, opacity: contentOpacity }}
        >
          <motion.div className="hero-badge" {...rise(0.15, reduced)}>
            <span className="hero-badge-dot" />
            <span className="hero-badge-label">Available for freelance</span>
          </motion.div>

          <motion.h1 className="hero-headline" {...rise(0.28, reduced)}>
            Yassine
            <br />
            Bouteraa
          </motion.h1>

          <motion.p className="hero-role" {...rise(0.4, reduced)}>
            Video Editor &amp; Motion Designer
          </motion.p>

          <motion.p className="hero-sub" {...rise(0.5, reduced)}>
            The difference between a scroll-past and a viral hit is in the edit. I craft
            cinematic, high-retention videos designed to hook instantly and turn viewers into
            paying clients.
          </motion.p>

          <motion.div className="hero-actions" {...rise(0.6, reduced)}>
            <MagneticButton
              className="btn-primary hero-cta"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #ec4899)' }}
              onClick={() => openModal('hire')}
            >
              <Briefcase size={20} />
              <span>Hire Me</span>
            </MagneticButton>

            <motion.a
              href="#showreel"
              className="hero-cta hero-cta-secondary"
              whileHover={reduced ? undefined : { y: -2 }}
              whileTap={reduced ? undefined : { scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <span>See my work</span>
              <motion.span
                style={{ display: 'flex' }}
                animate={reduced ? undefined : { y: [0, 4, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              >
                <ArrowDown size={18} />
              </motion.span>
            </motion.a>
          </motion.div>

          <motion.div className="hero-stats" {...rise(0.72, reduced)}>
            {STATS.map((stat) => (
              <div className="hero-stat" key={stat.label}>
                <span className="hero-stat-value">{stat.value}</span>
                <span className="hero-stat-label">{stat.label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Outer element owns scroll-linked parallax (an external MotionValue
            bound via style.y); the inner one owns the mount entrance. Framer
            Motion treats an external style MotionValue as the sole driver for
            that transform key, so animate.y on the same node would no-op if
            both lived together — this is why they're split. */}
        <motion.div className="hero-photo" style={reduced ? undefined : { y: photoY }}>
          <motion.div
            className="hero-photo-entrance"
            initial={reduced ? undefined : { opacity: 0, scale: 0.94, y: 24 }}
            animate={reduced ? undefined : { opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1, ease: EASE, delay: 0.3 }}
          >
            <div className="hero-photo-glow" aria-hidden="true" />

            <div className="hero-photo-frame">
              <span className="hero-photo-bracket hero-photo-bracket-tl" />
              <span className="hero-photo-bracket hero-photo-bracket-br" />

              <img
                className="hero-photo-img"
                src="/hero-cutout.png"
                alt="Yassine Bouteraa"
                onError={(event) => {
                  event.currentTarget.closest('.hero-photo').style.display = 'none';
                }}
              />
            </div>

            <motion.div className="hero-tools-chip" {...rise(0.85, reduced, 16)}>
              <Layers size={16} />
              <span>DaVinci · Premiere · AE</span>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
