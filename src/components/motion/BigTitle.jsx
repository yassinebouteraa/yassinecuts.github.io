import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';

import { SliceText } from './SliceText.jsx';

/**
 * A giant chapter title, cut like the logo, that owns its own stretch of
 * scroll. The two halves slide in from opposite sides and meet on the cut,
 * an orange razor line flashes along the join, then on the way out the
 * halves keep travelling and slip apart while the next section scrolls up
 * over them (the track has a negative bottom margin).
 */
export function BigTitle({ text, kicker, scene }) {
  const ref = useRef(null);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const p = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.0005 });

  const sep = useTransform(p, [0.2, 0.36, 0.5, 0.7], [-1, 0, 0, 1]);
  const opacity = useTransform(p, [0.2, 0.32, 0.54, 0.7], [0, 1, 1, 0]);
  const slitDraw = useTransform(p, [0.3, 0.4], [0, 1]);
  const slitFade = useTransform(p, [0.3, 0.34, 0.46, 0.52], [0, 1, 1, 0]);
  const kickerOpacity = useTransform(p, [0.28, 0.38, 0.48, 0.56], [0, 1, 1, 0]);

  const kickerEl = kicker && (
    <span className="big-title-kicker">
      {scene != null && <span className="big-title-scene">SC {String(scene).padStart(2, '0')}</span>}
      {kicker}
    </span>
  );

  if (reduced) {
    return (
      <div className="big-title-static" aria-hidden="true">
        {kickerEl}
        <p className="big-title">{text}</p>
      </div>
    );
  }

  return (
    <div className="big-title-track" ref={ref} aria-hidden="true">
      <div className="big-title-sticky">
        {kicker && <motion.div style={{ opacity: kickerOpacity }}>{kickerEl}</motion.div>}
        <SliceText
          text={text}
          className="big-title"
          sep={sep}
          opacity={opacity}
          slitDraw={slitDraw}
          slitFade={slitFade}
        />
      </div>
    </div>
  );
}
