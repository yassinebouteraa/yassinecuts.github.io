import { Reveal } from './Reveal.jsx';

/**
 * The small "SEQUENCE 02 — SHOWREEL" marker above a section heading.
 * Echoes the hero's viewfinder-HUD typography so that language carries
 * through the whole page instead of stopping at the fold.
 */
export function SectionKicker({ index, total, label, centered = false }) {
  const className = centered ? 'section-kicker section-kicker-centered' : 'section-kicker';

  return (
    <Reveal direction="left" distance={0.35} duration={0.6} className={className}>
      <span className="section-kicker-index">
        {String(index).padStart(2, '0')}
        <span className="section-kicker-total">/{String(total).padStart(2, '0')}</span>
      </span>
      <span className="section-kicker-line" aria-hidden="true" />
      <span className="section-kicker-label">{label}</span>
    </Reveal>
  );
}
