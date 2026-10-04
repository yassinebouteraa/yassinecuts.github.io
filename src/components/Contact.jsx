import { useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';
import { Briefcase, Instagram, MessageCircle, Phone, Scissors } from 'lucide-react';

import { useModal } from '../context/ModalContext.jsx';
import { Reveal, Stagger } from './motion/Reveal.jsx';
import { SectionKicker } from './motion/SectionKicker.jsx';
import { MagneticButton } from './motion/MagneticButton.jsx';
import { SliceText } from './motion/SliceText.jsx';
import { revealVariants } from './motion/variants.js';

const pillVariants = revealVariants('up', { distance: 0.4, duration: 0.6 });

const PILLS = [
  {
    href: 'tel:+21658526615',
    label: '+216 58 526 615',
    icon: Phone,
    color: 'var(--primary-color)',
    external: false,
  },
  {
    href: 'https://wa.me/21658526615',
    label: 'WhatsApp',
    icon: MessageCircle,
    color: '#25D366',
    external: true,
  },
  {
    href: 'https://www.instagram.com/yassinecuts',
    label: '@yassinecuts',
    icon: Instagram,
    color: 'var(--accent-color)',
    external: true,
  },
];

const CORNERS = [
  ['tl', -1, -1],
  ['tr', 1, -1],
  ['bl', -1, 1],
  ['br', 1, 1],
];

/**
 * "Make the cut": CONTACT sits sliced like the logo. Scrolling draws an
 * orange razor along the cut with a pair of scissors riding the blade, the
 * two halves split apart, and the contact card opens out of the gap like a
 * letterbox widening to full frame, with viewfinder corners snapping on.
 * An export bar along the bottom fills with the scroll and reads READY.
 */
export function Contact() {
  const reduced = useReducedMotion();
  const ref = useRef(null);

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const p = useSpring(scrollYProgress, { stiffness: 110, damping: 28, restDelta: 0.0005 });

  // 1. The razor draws along the cut.
  const slitDraw = useTransform(p, [0.08, 0.3], [0, 1]);
  const slitFade = useTransform(p, [0.06, 0.1, 0.42, 0.5], [0, 1, 1, 0]);
  const razorLeft = useTransform(slitDraw, (v) => `${v * 100}%`);
  // Follows the cut line, which rises from 61% to 43% of the title's height.
  const razorTop = useTransform(slitDraw, (v) => `${61 - 18 * v}%`);
  const razorOpacity = useTransform(p, [0.06, 0.1, 0.28, 0.33], [0, 1, 1, 0]);
  const hintOpacity = useTransform(p, [0, 0.07], [1, 0]);
  // 2. The halves split apart and fade.
  const sep = useTransform(p, [0.3, 0.5], [0, 1.6]);
  const titleOpacity = useTransform(p, [0.34, 0.48], [1, 0]);
  // 3. The card opens out of the gap.
  const cardClip = useTransform(
    p,
    [0.46, 0.68],
    ['inset(49% 0% 49% 0% round 24px)', 'inset(0% 0% 0% 0% round 24px)']
  );
  const cardOpacity = useTransform(p, [0.46, 0.5], [0, 1]);
  const cardScale = useTransform(p, [0.46, 0.72], [0.94, 1]);
  const cardPointer = useTransform(p, (v) => (v > 0.6 ? 'auto' : 'none'));
  const cornerSpread = useTransform(p, [0.6, 0.74], [44, 0]);
  const cornerOpacity = useTransform(p, [0.6, 0.66], [0, 1]);
  // 4. The export bar fills, reads READY, then gets out of the way.
  const exportPct = useTransform(p, [0.05, 0.58], [0, 100]);
  const exportWidth = useTransform(exportPct, (v) => `${v}%`);
  const exportLabel = useTransform(exportPct, (v) =>
    v >= 99.5 ? 'Ready · final_cut.mp4' : `Exporting · ${Math.round(v)}%`
  );
  const exportOpacity = useTransform(p, [0.62, 0.7], [1, 0]);

  if (reduced) {
    return (
      <section id="contact" className="container section" style={{ paddingTop: '2rem' }}>
        <SectionKicker index={5} total={5} label="Contact" centered />
        <ContactPanel />
      </section>
    );
  }

  return (
    <section id="contact" ref={ref} className="cut-track">
      <div className="cut-sticky">
        <motion.div className="cut-title" style={{ opacity: titleOpacity }} aria-hidden="true">
          <p className="big-title-kicker">
            <span className="big-title-scene">SC 05</span>
            Let&apos;s talk
          </p>
          <div className="cut-title-box">
            <SliceText text="Contact" className="big-title" sep={sep} slitDraw={slitDraw} slitFade={slitFade} />
            <motion.span
              className="cut-razor"
              style={{ left: razorLeft, top: razorTop, opacity: razorOpacity }}
            >
              <Scissors size={26} />
            </motion.span>
          </div>
          <motion.p className="cut-hint" style={{ opacity: hintOpacity }}>
            Scroll to make the cut
          </motion.p>
        </motion.div>

        <motion.div className="cut-content container" style={{ scale: cardScale, pointerEvents: cardPointer }}>
          <motion.div style={{ opacity: cardOpacity }}>
            <SectionKicker index={5} total={5} label="Contact" centered />
          </motion.div>
          <div className="cut-card-wrap">
            <motion.div className="cut-card" style={{ clipPath: cardClip, opacity: cardOpacity }}>
              <ContactPanel />
            </motion.div>
            {CORNERS.map(([pos, sx, sy]) => (
              <Corner key={pos} pos={pos} sx={sx} sy={sy} spread={cornerSpread} opacity={cornerOpacity} />
            ))}
          </div>
        </motion.div>

        <motion.div className="cut-export" style={{ opacity: exportOpacity }} aria-hidden="true">
          <motion.span className="cut-export-label">{exportLabel}</motion.span>
          <span className="cut-export-track">
            <motion.span className="cut-export-fill" style={{ width: exportWidth }} />
          </span>
        </motion.div>
      </div>
    </section>
  );
}

function Corner({ pos, sx, sy, spread, opacity }) {
  const x = useTransform(spread, (v) => v * sx);
  const y = useTransform(spread, (v) => v * sy);
  return <motion.span className={`cut-corner cut-corner-${pos}`} style={{ x, y, opacity }} aria-hidden="true" />;
}

function ContactPanel() {
  const { openModal } = useModal();
  const reduced = useReducedMotion();
  const [avatarFailed, setAvatarFailed] = useState(false);

  return (
      <Reveal className="glass-panel contact-panel">
        <div className="pulse-glow contact-glow" />

        <div className="contact-inner">
          <div className="contact-avatar avatar-float">
            {avatarFailed ? (
              <div className="contact-avatar-fallback">YB</div>
            ) : (
              <img
                src="/profile.webp"
                alt="Yassine Bouteraa"
                width="400"
                height="400"
                loading="lazy"
                decoding="async"
                onError={() => setAvatarFailed(true)}
              />
            )}
          </div>

          <h2 className="contact-name">
            Yassine <span className="text-gradient">Bouteraa</span>
          </h2>

          <p className="contact-blurb">
            Ready to make your next video go viral? Let&apos;s collaborate. Reach out to me directly
            below.
          </p>

          <Stagger className="contact-pills" stagger={0.1}>
            {PILLS.map(({ href, label, icon: Icon, color, external }) => (
              <motion.a
                key={label}
                className="glass-panel contact-pill"
                href={href}
                target={external ? '_blank' : undefined}
                rel={external ? 'noopener noreferrer' : undefined}
                variants={pillVariants}
                whileHover={reduced ? undefined : { y: -3, borderColor: color }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <Icon size={20} style={{ color }} />
                <span>{label}</span>
              </motion.a>
            ))}
          </Stagger>

          <div className="center-row">
            <MagneticButton
              className="glass-panel contact-cta"
              onClick={() => openModal('hire')}
              strength={0.25}
            >
              <Briefcase size={24} style={{ color: 'var(--primary-color)' }} />
              <span>Start a Project</span>
            </MagneticButton>
          </div>
        </div>
      </Reveal>
  );
}
