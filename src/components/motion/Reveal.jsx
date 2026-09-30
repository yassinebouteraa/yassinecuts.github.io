import { motion, useReducedMotion } from 'motion/react';
import { revealVariants, staggerVariants, VIEWPORT } from './variants.js';

/**
 * Scroll-triggered entrance for a single element.
 * Replaces the old `.reveal` / IntersectionObserver CSS classes.
 */
export function Reveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.9,
  distance = 1,
  as = 'div',
  viewport = VIEWPORT,
  ...rest
}) {
  const reduced = useReducedMotion();
  const Tag = motion[as] ?? motion.div;

  if (reduced) return <Tag {...rest}>{children}</Tag>;

  return (
    <Tag
      variants={revealVariants(direction, { distance, duration })}
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      transition={{ delay }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/**
 * Parent that staggers its `<RevealItem>` children as the group scrolls in.
 */
export function Stagger({
  children,
  stagger = 0.09,
  delayChildren = 0,
  as = 'div',
  viewport = VIEWPORT,
  ...rest
}) {
  const reduced = useReducedMotion();
  const Tag = motion[as] ?? motion.div;

  if (reduced) return <Tag {...rest}>{children}</Tag>;

  return (
    <Tag
      variants={staggerVariants({ stagger, delayChildren })}
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/** A child of `<Stagger>`. Inherits the parent's timing, so it takes no delay. */
export function RevealItem({
  children,
  direction = 'up',
  distance = 0.5,
  duration = 0.7,
  as = 'div',
  ...rest
}) {
  const reduced = useReducedMotion();
  const Tag = motion[as] ?? motion.div;

  if (reduced) return <Tag {...rest}>{children}</Tag>;

  return (
    <Tag variants={revealVariants(direction, { distance, duration })} {...rest}>
      {children}
    </Tag>
  );
}
