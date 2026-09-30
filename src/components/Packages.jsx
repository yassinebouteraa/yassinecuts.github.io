import { motion, useReducedMotion } from 'motion/react';
import { Check, Film, Zap } from 'lucide-react';

import { useModal } from '../context/ModalContext.jsx';
import { useMediaQuery } from '../hooks/useMediaQuery.js';
import { Reveal, Stagger } from './motion/Reveal.jsx';
import { TextReveal } from './motion/TextReveal.jsx';
import { SectionKicker } from './motion/SectionKicker.jsx';
import { MagneticButton } from './motion/MagneticButton.jsx';
import { EASE } from './motion/variants.js';

const PACKAGES = [
  {
    id: 'Basic Edit',
    name: 'Basic',
    accent: 'Edit',
    tagline: 'Perfect for simple, clean content',
    price: '$49',
    unit: '/video',
    features: [
      'Up to 60s Reel/Short',
      'Basic Cuts',
      'Motion Captions',
      'Stock Music & SFX',
      '1 Revision',
    ],
  },
  {
    id: 'The Viral',
    name: 'The',
    accent: 'Viral',
    tagline: 'Optimized for high retention',
    price: '$149',
    unit: '/video',
    featured: true,
    features: [
      'Cinematic Storytelling',
      'High-Retention Editing',
      'Advanced Hooks & VFX',
      'Color Grading',
      'Fast 48h Delivery',
    ],
  },
  {
    id: 'The Elite',
    name: 'The',
    accent: 'Elite',
    tagline: 'Full YouTube/Ads production',
    price: '$299+',
    unit: '',
    features: [
      'Long-form Content (10m+)',
      'Unlimited Revisions',
      'Dynamic Thumbnails',
      'Strategy Consultation',
    ],
  },
];

export function Packages() {
  const { openModal } = useModal();
  const reduced = useReducedMotion();
  const isDesktop = useMediaQuery('(min-width: 992px)');

  // The featured card sits slightly proud of its neighbours on desktop, so its
  // entrance has to settle at that scale rather than at 1.
  function cardVariants(featured) {
    const restScale = featured && isDesktop ? 1.05 : 1;
    return {
      hidden: { opacity: 0, y: 48, scale: restScale * 0.95 },
      visible: { opacity: 1, y: 0, scale: restScale, transition: { duration: 0.75, ease: EASE } },
    };
  }

  return (
    <section id="packages" className="container section">
      <div className="section-glow section-glow-packages" aria-hidden="true" />

      <SectionKicker index={4} total={5} label="Packages" centered />

      <Reveal className="stack-center" direction="down">
        <TextReveal as="h3" text="Service Packages" gradientFrom={1} />
        <p>Choose the perfect fit for your content needs</p>
      </Reveal>

      <Stagger className="package-grid" stagger={0.12}>
        {PACKAGES.map((pkg) => (
          <motion.div
            key={pkg.id}
            className={`glass-panel package-card${pkg.featured ? ' package-card-featured' : ''}`}
            variants={cardVariants(pkg.featured)}
            whileHover={reduced ? undefined : { y: -10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          >
            {pkg.featured && <div className="package-badge">Most Popular</div>}

            <h4 className="package-name">
              {pkg.name} <span className="text-gradient">{pkg.accent}</span>
            </h4>
            <p className="package-tagline">{pkg.tagline}</p>
            <div className="package-price">
              {pkg.price}
              {pkg.unit && <span>{pkg.unit}</span>}
            </div>

            <ul className="package-features">
              {pkg.features.map((feature) => (
                <li key={feature}>
                  <Check size={18} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <MagneticButton
              className="btn-primary"
              style={
                pkg.featured
                  ? { width: '100%', background: 'linear-gradient(135deg, #4f46e5, #ec4899)' }
                  : { width: '100%' }
              }
              strength={0.15}
              onClick={() => openModal('hire', { package: pkg.id })}
            >
              Select Package
            </MagneticButton>
          </motion.div>
        ))}
      </Stagger>

      <Reveal className="stack-center" style={{ marginBottom: '2rem' }}>
        <TextReveal as="h4" text="Monthly Retainers" gradientFrom={1} />
        <p>Scale your brand with consistent, high-quality content</p>
      </Reveal>

      <Reveal style={{ maxWidth: 900, margin: '0 auto' }}>
        <motion.div
          className="glass-panel retainer-card"
          whileHover={reduced ? undefined : { y: -6, boxShadow: '0 18px 40px rgba(0, 0, 0, 0.45)' }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        >
          <div style={{ flex: 1, minWidth: 250 }}>
            <h5 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Creator <span className="text-gradient">Package</span>
            </h5>
            <p className="text-muted">Master the algorithm with a steady flow of content.</p>

            <div className="retainer-perks">
              <div>
                <Film size={20} style={{ color: 'var(--primary-color)' }} /> 12 Shorts / Month
              </div>
              <div>
                <Zap size={20} style={{ color: 'var(--accent-color)' }} /> Priority Delivery
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right', minWidth: 200 }}>
            <div className="package-price" style={{ marginBottom: '1rem' }}>
              $1290 <span>/mo</span>
            </div>
            <MagneticButton
              className="btn-primary"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #ec4899)' }}
              onClick={() => openModal('hire', { package: 'Creator Package' })}
            >
              Get Access
            </MagneticButton>
          </div>
        </motion.div>
      </Reveal>
    </section>
  );
}
