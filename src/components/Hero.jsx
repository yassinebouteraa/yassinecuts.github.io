import { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, useReducedMotion } from 'motion/react';
import { ArrowDown, Briefcase, Clapperboard, Cpu, Layers, Sparkles } from 'lucide-react';

import { useModal } from '../context/ModalContext.jsx';
import { useMediaQuery } from '../hooks/useMediaQuery.js';
import { MagneticButton } from './motion/MagneticButton.jsx';
import { CountUp } from './motion/CountUp.jsx';
import { EASE } from './motion/variants.js';

const STATS = [
  { value: 50, suffix: '+', label: 'Videos Edited' },
  { value: 10, suffix: 'M+', label: 'Views Generated' },
  { value: 100, suffix: '%', label: 'Client Satisfaction' },
];

const TECH = [
  { icon: Layers, label: 'DaVinci Resolve' },
  { icon: Cpu, label: 'Premiere Pro' },
  { icon: Clapperboard, label: 'After Effects' },
];

// The hero is above the fold, so it animates on mount rather than on scroll.
// Delays are staged so the eye lands on photo → name → role → copy → CTA.
const rise = (delay) => ({
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: EASE, delay },
});

const fade = (delay, duration = 1) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration, ease: 'easeOut', delay },
});

export function Hero() {
  const { openModal } = useModal();
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Scroll-linked parallax: the wordmark drifts fastest, the photo slower,
  // the copy slowest — which reads as depth rather than as an effect.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  const smooth = useSpring(scrollYProgress, { stiffness: 90, damping: 30, restDelta: 0.001 });

  const wordmarkY = useTransform(smooth, [0, 1], [0, isMobile ? 40 : 220]);
  const photoY = useTransform(smooth, [0, 1], [0, isMobile ? 20 : 120]);
  const contentY = useTransform(smooth, [0, 1], [0, isMobile ? 0 : 60]);
  const contentOpacity = useTransform(smooth, [0, 0.75], [1, isMobile ? 1 : 0]);

  // Parallax is layout-sensitive; skip it when the visitor asked for less motion.
  // The key is omitted entirely rather than set to undefined, which would leave
  // an invalid value in the composed transform.
  const parallaxY = (value) => (reduced ? {} : { y: value });

  return (
    <section className="hero-editorial" ref={ref}>
      <motion.div
        className="hero-editorial-bg-text"
        aria-hidden="true"
        {...fade(0.1, 1.4)}
        style={{
          x: '-50%',
          scaleX: isMobile ? 1 : 1.3,
          scaleY: isMobile ? 1.6 : 3.5,
          transformOrigin: 'top center',
          ...parallaxY(wordmarkY),
        }}
      >
        PORTFOLIO
      </motion.div>

      <motion.div className="hero-corner hero-corner-left" {...fade(0.9)}>
        <span className="hero-corner-title">VIDEO EDITOR</span>
        <span className="hero-corner-sub">Content Creator</span>
      </motion.div>

      <motion.div className="hero-corner hero-corner-right" {...fade(0.9)}>
        <span className="hero-corner-title">AVAILABLE FOR FREELANCE</span>
      </motion.div>

      <motion.div
        className="hero-photo-wrap"
        style={{ x: isMobile ? 0 : '-50%', ...parallaxY(photoY) }}
      >
        <motion.img
          className="hero-editorial-photo"
          src="/hero-cutout.png"
          alt="Yassine Bouteraa"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: EASE, delay: 0.25 }}
          onError={(event) => {
            event.currentTarget.style.display = 'none';
          }}
        />
      </motion.div>

      <motion.div
        className="hero-editorial-container"
        style={reduced ? undefined : { y: contentY, opacity: contentOpacity }}
      >
        <div className="hero-editorial-content">
          <motion.p className="hero-editorial-greeting" {...rise(0.35)}>
            Hello, I&apos;m
          </motion.p>

          <motion.h2 className="hero-editorial-title" {...rise(0.5)}>
            Yassine
            <br />
            Bouteraa
          </motion.h2>

          <motion.p className="hero-editorial-role" {...rise(0.65)}>
            Video Editor &amp;
            <br />
            Motion Designer
          </motion.p>

          <motion.p className="hero-editorial-desc" {...rise(0.8)}>
            The difference between a scroll-past and a viral hit is in the edit. I craft cinematic,
            high-retention videos designed to hook instantly, grow your following, and turn viewers
            into paying clients.
          </motion.p>

          <motion.div className="hero-editorial-cta" {...rise(0.95)}>
            <MagneticButton
              className="btn-primary"
              style={{
                padding: '1rem 2rem',
                fontSize: '1.1rem',
                background: 'linear-gradient(135deg, #4f46e5, #ec4899)',
              }}
              onClick={() => openModal('hire')}
            >
              <Briefcase size={24} />
              <span>Hire Me</span>
            </MagneticButton>

            <motion.a
              href="#showreel"
              className="hero-showreel-link"
              whileHover={reduced ? undefined : { x: 4 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <span>Unlock My Showreel</span>
              <motion.span
                style={{ display: 'flex' }}
                animate={reduced ? undefined : { y: [0, 5, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              >
                <ArrowDown size={20} />
              </motion.span>
            </motion.a>
          </motion.div>
        </div>

        <div className="hero-editorial-stats">
          <motion.div className="hero-accent-tagline" {...rise(0.9)}>
            <motion.div
              className="hero-accent-circle"
              animate={reduced ? undefined : { rotate: 360 }}
              transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles size={20} />
            </motion.div>
            <p>
              Turning raw footage
              <br />
              into scroll-stopping
              <br />
              viral content.
            </p>
          </motion.div>

          {STATS.map((stat, index) => (
            <motion.div key={stat.label} className="hero-editorial-stat" {...rise(1 + index * 0.15)}>
              <span className="hero-editorial-stat-number">
                <CountUp value={stat.value} suffix={stat.suffix} />
              </span>
              <span className="hero-editorial-stat-label">{stat.label}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div className="hero-editorial-techstack" {...rise(1.2)}>
        {TECH.map(({ icon: Icon, label }) => (
          <motion.div
            key={label}
            className="hero-tech-item"
            whileHover={reduced ? undefined : { color: 'var(--text-main)', y: -3 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <Icon size={24} />
            <span>{label}</span>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
