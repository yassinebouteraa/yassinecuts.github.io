import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from 'motion/react';

import { VideoCard } from './VideoCard.jsx';
import { EASE } from './motion/variants.js';

// How much scroll distance the whole channel-flip experience gets, scaled by
// how many reels there are — capped on both ends so two reels don't feel
// instant and thirty reels don't force an absurdly long scroll.
const VH_PER_REEL = 55;
const MIN_TRACK_VH = 280;
const MAX_TRACK_VH = 900;

// Long enough for the multi-step colour distortion to actually register as a
// glitch rather than a blink, short enough not to feel like a loading stall.
const GLITCH_MS = 400;

/**
 * Fresh random tear-bars for each glitch, so the effect never repeats the
 * same pattern twice — a glitch that plays identically every time reads as
 * an animation, not a malfunction.
 */
function makeGlitchBars() {
  return Array.from({ length: 3 }, (_, i) => ({
    id: i,
    top: 6 + Math.random() * 78,
    height: 3 + Math.random() * 9,
    offset: (Math.random() - 0.5) * 44,
    tint: Math.random() > 0.5 ? 'rgba(255, 0, 140, 0.38)' : 'rgba(0, 225, 255, 0.32)',
  }));
}

/**
 * Drives which reel is "on screen" from scroll position, without hijacking
 * the scroll itself. The track below is a tall, ordinary block; this just
 * reads how far the user has scrolled through it (0 → 1) and turns that into
 * a step index. The "TV stays put while you scroll" feel comes entirely from
 * plain CSS `position: sticky` on the shell — no manual scroll-locking, no
 * preventDefault, nothing that fights the browser's own scrolling.
 */
function useChannelIndex(trackRef, total) {
  const [index, setIndex] = useState(0);
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ['start start', 'end end'] });

  useMotionValueEvent(scrollYProgress, 'change', (progress) => {
    const next = Math.min(total - 1, Math.max(0, Math.floor(progress * total)));
    setIndex((current) => (current === next ? current : next));
  });

  return index;
}

export function TvShowreel({ videos }) {
  const total = videos.length;
  const trackRef = useRef(null);
  const reduced = useReducedMotion();
  const scrollIndex = useChannelIndex(trackRef, total);

  // `scrollIndex` only recalculates on a scroll event, so if a video is
  // deleted (shrinking `total`) while the page hasn't scrolled since, it can
  // briefly point past the end of the new, shorter array. Clamped here so
  // that can never read out of bounds regardless of when it next updates.
  const index = Math.min(scrollIndex, total - 1);
  const activeVideo = videos[index];

  // The channel-change glitch: colour distortion and signal jitter (CSS, via
  // the .tv-glitching class) layered with a static burst and randomised
  // magenta/cyan tear bars. Non-null only while a glitch is playing, so it
  // doubles as both the "is glitching" flag and the bars' data.
  const [glitch, setGlitch] = useState(null);
  const previousIndex = useRef(index);

  useEffect(() => {
    if (previousIndex.current === index) return;
    previousIndex.current = index;
    if (reduced) return undefined;
    setGlitch(makeGlitchBars());
    const id = window.setTimeout(() => setGlitch(null), GLITCH_MS);
    return () => window.clearTimeout(id);
  }, [index, reduced]);

  const trackHeight = Math.min(MAX_TRACK_VH, Math.max(MIN_TRACK_VH, total * VH_PER_REEL));

  return (
    <div ref={trackRef} className="tv-track" style={{ height: `${trackHeight}vh` }}>
      <div className="tv-sticky">
        <div className="tv-shell">
          <div className="tv-antenna" aria-hidden="true">
            <span />
            <span />
          </div>

          <div className={`tv-screen${glitch ? ' tv-glitching' : ''}`}>
            {/* The power-on sweep: fires once, the first time the TV scrolls
                into view, independent of channel-changing afterward. */}
            <motion.div
              className="tv-power"
              initial={reduced ? undefined : { scaleY: 0.035 }}
              whileInView={reduced ? undefined : { scaleY: 1 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.65, ease: EASE, delay: 0.1 }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeVideo.id}
                  className="tv-channel"
                  initial={reduced ? undefined : { opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduced ? undefined : { opacity: 0, scale: 1.04 }}
                  transition={{ duration: 0.32, ease: EASE }}
                >
                  <VideoCard video={activeVideo} />
                </motion.div>
              </AnimatePresence>

              {glitch && (
                <>
                  <div className="tv-static" aria-hidden="true" />
                  {glitch.map((bar) => (
                    <div
                      key={bar.id}
                      className="tv-glitch-bar"
                      aria-hidden="true"
                      style={{
                        top: `${bar.top}%`,
                        height: `${bar.height}%`,
                        background: bar.tint,
                        transform: `translateX(${bar.offset}px)`,
                      }}
                    />
                  ))}
                </>
              )}
            </motion.div>
          </div>

          <div className="tv-controls-row">
            <div className="tv-speaker" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
            <span className="tv-readout">
              {String(index + 1).padStart(2, '0')}
              <span className="section-kicker-total">/{String(total).padStart(2, '0')}</span>
            </span>
            <span className="tv-knob" aria-hidden="true" />
            <span className="tv-knob" aria-hidden="true" />
          </div>
        </div>

        <p className="tv-hint">{total > 1 ? 'Keep scrolling to flip channels' : 'Click to play'}</p>
      </div>
    </div>
  );
}
