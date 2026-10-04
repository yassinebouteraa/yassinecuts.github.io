import { motion, useReducedMotion } from 'motion/react';

import { EASE } from './variants.js';

/**
 * Reveals a headline the way an editor scrubs a clip: an orange playhead,
 * like the one on a timeline, sweeps left to right and the text appears
 * behind it. The playhead then drops away.
 *
 * `text` may contain "\n" for a line break.
 */
export function PlayheadReveal({ text, delay = 0, duration = 1.1 }) {
  const reduced = useReducedMotion();
  const lines = text.split('\n').map((line, i) => (
    <span key={i} style={{ display: 'block' }}>
      {line}
    </span>
  ));

  if (reduced) return <span className="playhead-reveal">{lines}</span>;

  const sweep = { duration, ease: EASE, delay };

  return (
    <span className="playhead-reveal">
      <motion.span
        className="playhead-reveal-text"
        initial={{ clipPath: 'inset(-10% 100% -10% 0%)' }}
        animate={{ clipPath: 'inset(-10% 0% -10% 0%)' }}
        transition={sweep}
      >
        {lines}
      </motion.span>
      <motion.span
        className="playhead-reveal-head"
        aria-hidden="true"
        initial={{ left: '0%', opacity: 0 }}
        animate={{ left: '100%', opacity: [0, 1, 1, 0] }}
        transition={{
          left: sweep,
          // Pops on at the start, rides the sweep, then fades once parked.
          opacity: { duration: duration + 0.4, delay, times: [0, 0.05, 0.75, 1] },
        }}
      />
    </span>
  );
}
