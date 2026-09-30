import { useEffect, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import {
  AudioLines,
  Captions,
  ChevronLeft,
  ChevronRight,
  Palette,
  Scissors,
  Sparkles,
  Zap,
} from 'lucide-react';

import { useMediaQuery } from '../hooks/useMediaQuery.js';
import { Reveal } from './motion/Reveal.jsx';
import { TextReveal } from './motion/TextReveal.jsx';
import { SectionKicker } from './motion/SectionKicker.jsx';

const SKILLS = [
  {
    icon: Palette,
    title: 'Color Grading',
    copy: 'Cinematic looks tuned to hold up across every feed and screen.',
  },
  {
    icon: Sparkles,
    title: 'Motion Graphics & VFX',
    copy: 'Kinetic titles and clean composites that serve the story, not the ego.',
  },
  {
    icon: AudioLines,
    title: 'Sound Design & Mixing',
    copy: 'Podcast-clean dialogue and mixes built for headphones and speakers alike.',
  },
  {
    icon: Scissors,
    title: 'Story-Driven Editing',
    copy: 'Pacing and structure decisions that keep the watch-time graph climbing.',
  },
  {
    icon: Captions,
    title: 'Platform-Native Captions',
    copy: 'Burned-in captions styled for the exact feed they are built to live in.',
  },
  {
    icon: Zap,
    title: 'Rapid Turnaround',
    copy: '48-hour delivery windows without cutting a single corner.',
  },
];

const TOTAL = SKILLS.length;
const AUTO_ADVANCE_MS = 4200;

// How far each layer sits from the active card. Desktop gets a deeper stack;
// small screens collapse to a tighter, shallower peek so nothing clips badly
// inside a narrow viewport.
const LAYERS = {
  full: {
    1: { x: 230, z: -170, rotate: 36, scale: 0.82, opacity: 0.55 },
    2: { x: 395, z: -340, rotate: 48, scale: 0.68, opacity: 0.2 },
  },
  compact: {
    1: { x: 150, z: -120, rotate: 34, scale: 0.8, opacity: 0.45 },
  },
};

/** Shortest signed distance from `active` to `index` around a ring of `total`. */
function ringOffset(index, active, total) {
  let raw = index - active;
  if (raw > total / 2) raw -= total;
  if (raw < -total / 2) raw += total;
  return raw;
}

export function Craft() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();
  const isCompact = useMediaQuery('(max-width: 640px)');

  const layers = isCompact ? LAYERS.compact : LAYERS.full;
  const maxLayer = isCompact ? 1 : 2;

  useEffect(() => {
    if (reduced || paused) return undefined;
    const id = window.setInterval(() => setActive((a) => (a + 1) % TOTAL), AUTO_ADVANCE_MS);
    return () => window.clearInterval(id);
  }, [reduced, paused]);

  function goTo(index) {
    setActive(((index % TOTAL) + TOTAL) % TOTAL);
  }

  function handleKeyDown(event) {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goTo(active + 1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goTo(active - 1);
    }
  }

  return (
    <section id="craft" className="container section">
      <SectionKicker index={1} total={5} label="The Craft" centered />

      <Reveal className="stack-center" style={{ marginBottom: '2.5rem' }}>
        <TextReveal as="h3" text="Every edit, covered" gradientFrom={2} />
        <p>Six disciplines, one deadline. Click a card or use the arrows to look around.</p>
      </Reveal>

      <div
        className="craft-stage-wrap"
        role="region"
        aria-roledescription="carousel"
        aria-label="Editing skills"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        style={{ '--craft-transition': reduced ? '0s' : '0.7s' }}
      >
        <div className="craft-glow" aria-hidden="true" />

        <div className="craft-stage">
          {SKILLS.map((skill, index) => {
            const offset = ringOffset(index, active, TOTAL);
            const abs = Math.abs(offset);
            const sign = Math.sign(offset);
            const isActive = offset === 0;
            const visible = abs <= maxLayer;
            const preset = abs === 0 ? null : layers[Math.min(abs, maxLayer)];

            const x = preset ? sign * preset.x : 0;
            const z = preset ? preset.z : 0;
            const rotate = preset ? -sign * preset.rotate : 0;
            const scale = preset ? preset.scale : 1;
            const opacity = visible ? (preset ? preset.opacity : 1) : 0;
            const zIndex = TOTAL - abs;

            const Icon = skill.icon;

            return (
              <div
                key={skill.title}
                className={`craft-card${isActive ? ' craft-card-active' : ''}`}
                style={{
                  transform: `translateX(${x}px) translateZ(${z}px) rotateY(${rotate}deg) scale(${scale})`,
                  opacity,
                  zIndex,
                  pointerEvents: visible && !isActive ? 'auto' : 'none',
                }}
                aria-hidden={!visible}
                aria-current={isActive ? 'true' : undefined}
                role={!isActive && visible ? 'button' : undefined}
                tabIndex={-1}
                onClick={!isActive && visible ? () => goTo(index) : undefined}
              >
                <span className="craft-card-index">{String(index + 1).padStart(2, '0')}</span>
                <div className="craft-card-icon">
                  <Icon size={26} />
                </div>
                <h4 className="craft-card-title">{skill.title}</h4>
                <p className="craft-card-copy">{skill.copy}</p>
              </div>
            );
          })}
        </div>

        <div className="craft-controls">
          <button className="btn-icon" onClick={() => goTo(active - 1)} aria-label="Previous skill">
            <ChevronLeft size={18} />
          </button>

          <span className="craft-readout">
            {String(active + 1).padStart(2, '0')}
            <span className="section-kicker-total">/{String(TOTAL).padStart(2, '0')}</span>
          </span>

          <button className="btn-icon" onClick={() => goTo(active + 1)} aria-label="Next skill">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}
