import { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, useReducedMotion } from 'motion/react';
import { ArrowDown, Briefcase } from 'lucide-react';

import { useModal } from '../context/ModalContext.jsx';
import { useMediaQuery } from '../hooks/useMediaQuery.js';
import { HeroBackground } from './HeroBackground.jsx';
import { MagneticButton } from './motion/MagneticButton.jsx';
import { EASE } from './motion/variants.js';

// Above the fold, so the hero animates on mount rather than on scroll.
// Everything rises through the same curve, staged badge → headline → buttons.
// With reduced motion the props drop out entirely and it renders static.
const rise = (delay, reduced) =>
  reduced
    ? {}
    : {
        initial: { opacity: 0, y: 28 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.8, ease: EASE, delay },
      };

export function Hero() {
  const { openModal } = useModal();
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const isMobile = useMediaQuery('(max-width: 768px)');

  // The copy drifts up and dissolves as the shard field scrolls past behind it.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });
  const smooth = useSpring(scrollYProgress, { stiffness: 90, damping: 30, restDelta: 0.001 });
  const contentY = useTransform(smooth, [0, 1], [0, isMobile ? 0 : 90]);
  const contentOpacity = useTransform(smooth, [0, 0.7], [1, isMobile ? 1 : 0]);

  return (
    <section className="hero" ref={ref}>
      <HeroBackground />
      <div className="hero-fade" aria-hidden="true" />

      <motion.div
        className="hero-inner"
        style={reduced ? undefined : { y: contentY, opacity: contentOpacity }}
      >
        <motion.div className="hero-badge" {...rise(0.15, reduced)}>
          <span className="hero-badge-chip">Available</span>
          <span className="hero-badge-label">Video Editor &amp; Motion Designer</span>
        </motion.div>

        <motion.h1 className="hero-headline" {...rise(0.3, reduced)}>
          Turning raw footage into scroll-stopping content
        </motion.h1>

        <motion.p className="hero-sub" {...rise(0.42, reduced)}>
          The difference between a scroll-past and a viral hit is in the edit.
        </motion.p>

        <motion.div className="hero-actions" {...rise(0.55, reduced)}>
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
      </motion.div>
    </section>
  );
}
