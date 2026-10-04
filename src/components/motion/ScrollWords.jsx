import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';

/**
 * A paragraph that lights up word by word as it scrolls into view, in
 * reading order. Scrubbed to scroll position, so scrolling back dims it.
 *
 * `accent` lists words (case-insensitive, punctuation ignored) that get an
 * orange underline drawn under them once they light up, like a clip being
 * selected on a timeline.
 */
export function ScrollWords({ text, as = 'p', className, accent = [] }) {
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const Tag = motion[as] ?? motion.p;
  const words = text.split(' ');
  const clean = (w) => w.toLowerCase().replace(/[^a-z0-9']/g, '');
  const accents = new Set(accent.map(clean));
  const isAccent = (w) => accents.has(clean(w));

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.92', 'start 0.45'] });

  if (reduced) {
    return (
      <Tag className={className}>
        {words.map((w, i) => (
          <span key={i} className={isAccent(w) ? 'scroll-word-accent' : undefined}>
            {w}
            {i < words.length - 1 ? ' ' : ''}
          </span>
        ))}
      </Tag>
    );
  }

  return (
    <Tag ref={ref} className={className}>
      {words.map((w, i) => (
        <Word
          key={i}
          progress={scrollYProgress}
          range={[i / words.length, (i + 1) / words.length]}
          accent={isAccent(w)}
          word={w}
          space={i < words.length - 1 ? ' ' : ''}
        />
      ))}
    </Tag>
  );
}

function Word({ word, space, progress, range, accent }) {
  // Each word fades over a window a bit wider than its slot, so neighbours
  // overlap and the light sweeps rather than ticking word by word.
  const [a, b] = range;
  const span = b - a;
  const input = [Math.max(0, a - span), Math.min(1, b + span)];
  const opacity = useTransform(progress, input, [0.14, 1]);
  // Accent underline draws just after its word has lit up.
  const underline = useTransform(progress, [b, Math.min(1, b + span * 3)], ['0% 2px', '100% 2px']);

  return (
    <motion.span className="scroll-word" style={{ opacity }}>
      {accent ? (
        <motion.span className="scroll-word-accent" style={{ backgroundSize: underline }}>
          {word}
        </motion.span>
      ) : (
        word
      )}
      {space}
    </motion.span>
  );
}
