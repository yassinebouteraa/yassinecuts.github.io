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

  // A brief "static" flash on every channel change — reusing the same grain
  // texture that already runs across the whole page, just intensified for a
  // moment, so it reads as an old TV's channel-change burst rather than a
  // plain crossfade.
  const [flashing, setFlashing] = useState(false);
  const previousIndex = useRef(index);

  useEffect(() => {
    if (previousIndex.current === index) return;
    previousIndex.current = index;
    if (reduced) return undefined;
    setFlashing(true);
    const id = window.setTimeout(() => setFlashing(false), 220);
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

          <div className={`tv-screen${flashing ? ' tv-screen-flash' : ''}`}>
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

              {flashing && <div className="tv-static" aria-hidden="true" />}
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
