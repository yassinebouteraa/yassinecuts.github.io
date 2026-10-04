import { motion, useReducedMotion } from 'motion/react';
import { wordVariants, staggerVariants, VIEWPORT } from './variants.js';

/**
 * Headline animation: each word is clipped by its own line box and slides up,
 * so the text appears to be uncovered rather than faded in.
 *
 * `text` may contain "\n" to force a line break.
 */
export function TextReveal({
  text,
  as = 'h3',
  stagger = 0.055,
  delayChildren = 0,
  className,
  style,
  gradientFrom,
  viewport = VIEWPORT,
  ...rest
}) {
  const reduced = useReducedMotion();
  const Tag = motion[as] ?? motion.h3;
  const lines = String(text).split('\n');

  if (reduced) {
    return (
      <Tag className={className} style={style} {...rest}>
        {lines.map((line, i) => (
          <span key={i} style={{ display: 'block' }}>
            {line}
          </span>
        ))}
      </Tag>
    );
  }

  let wordIndex = -1;

  return (
    <Tag
      className={className}
      style={style}
      variants={staggerVariants({ stagger, delayChildren })}
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      {...rest}
    >
      {lines.map((line, lineIdx) => (
        <span key={lineIdx} style={{ display: 'block', overflow: 'hidden', paddingBottom: '0.08em' }}>
          {line.split(' ').map((word, i) => {
            wordIndex += 1;
            // Words at or past `gradientFrom` get the brand gradient.
            const gradient = gradientFrom != null && wordIndex >= gradientFrom;
            return (
              <motion.span
                key={`${lineIdx}-${i}`}
                variants={wordVariants}
                className={gradient ? 'text-gradient' : undefined}
                style={{ display: 'inline-block', whiteSpace: 'pre' }}
              >
                {word}
                {i < line.split(' ').length - 1 ? ' ' : ''}
              </motion.span>
            );
          })}
        </span>
      ))}
    </Tag>
  );
}
