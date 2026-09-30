import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Briefcase, Instagram, MessageCircle, Phone } from 'lucide-react';

import { useModal } from '../context/ModalContext.jsx';
import { Reveal, Stagger } from './motion/Reveal.jsx';
import { SectionKicker } from './motion/SectionKicker.jsx';
import { MagneticButton } from './motion/MagneticButton.jsx';
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

export function Contact() {
  const { openModal } = useModal();
  const reduced = useReducedMotion();
  const [avatarFailed, setAvatarFailed] = useState(false);

  return (
    <section id="contact" className="container section" style={{ paddingTop: '2rem' }}>
      <SectionKicker index={5} total={5} label="Contact" centered />

      <Reveal className="glass-panel contact-panel">
        <div className="pulse-glow contact-glow" />

        <div className="contact-inner">
          <div className="contact-avatar avatar-float">
            {avatarFailed ? (
              <div className="contact-avatar-fallback">YB</div>
            ) : (
              <img src="/profile.jpg" alt="Yassine Bouteraa" onError={() => setAvatarFailed(true)} />
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
    </section>
  );
}
