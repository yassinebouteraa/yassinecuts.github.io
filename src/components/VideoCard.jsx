import { useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Maximize2, Pencil, Play, Trash2 } from 'lucide-react';

import { useAdmin } from '../context/AdminContext.jsx';
import { useModal } from '../context/ModalContext.jsx';
import { usePortfolio } from '../context/PortfolioContext.jsx';
import { useMediaQuery } from '../hooks/useMediaQuery.js';
import { getEmbedInfo } from '../lib/embed.js';
import { TiltCard } from './motion/TiltCard.jsx';
import { EASE, SPRING } from './motion/variants.js';

function PlayOverlay({ visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="video-play-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: EASE }}
        >
          <motion.div
            className="video-play-button"
            initial={{ scale: 0.7 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.7 }}
            transition={SPRING}
          >
            <Play size={28} fill="white" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// `rest` carries the entrance variants handed down by the <Stagger> grid.
export function VideoCard({ video, ...rest }) {
  const url = video.video_url ?? video.videoUrl;
  const embed = getEmbedInfo(url);

  const { isAdmin } = useAdmin();
  const { openModal } = useModal();
  const { removeVideo } = usePortfolio();
  const reduced = useReducedMotion();
  // Touch devices never hover, so the play affordance has to be permanent there.
  const isTouch = useMediaQuery('(hover: none)');

  const videoRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [embedStarted, setEmbedStarted] = useState(false);

  // Show the play button whenever hovering can't be relied on to reveal it.
  const alwaysShowPlay = isTouch || reduced;

  const isYouTube = embed.type === 'youtube' || embed.type === 'youtube-short';
  const isShort = embed.type === 'youtube-short';
  const isDirect = embed.type === 'direct';

  function toggleDirectPlayback() {
    const element = videoRef.current;
    if (!element) return;
    if (element.paused) {
      element.play();
      setPlaying(true);
    } else {
      element.pause();
      setPlaying(false);
    }
  }

  function requestFullscreen() {
    const element = videoRef.current;
    if (!element) return;
    if (element.requestFullscreen) element.requestFullscreen();
    else if (element.webkitRequestFullscreen) element.webkitRequestFullscreen();
  }

  async function handleDelete() {
    if (!window.confirm('Delete this video from the database?')) return;
    try {
      await removeVideo(video.id);
    } catch (error) {
      window.alert(`Could not delete: ${error.message}`);
    }
  }

  const hasInfo = Boolean(video.title || video.description || isAdmin);

  return (
    <TiltCard
      className="video-card"
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      {...rest}
    >
      <div className="video-thumbnail-container">
        {isYouTube && !embedStarted && (
          <div
            className="video-poster"
            style={{ aspectRatio: isShort ? '9 / 16' : '16 / 9' }}
            onClick={() => setEmbedStarted(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') setEmbedStarted(true);
            }}
          >
            <motion.img
              src={`https://img.youtube.com/vi/${embed.id}/maxresdefault.jpg`}
              alt={video.title || 'Video thumbnail'}
              loading="lazy"
              animate={reduced ? undefined : { scale: hovered ? 1.06 : 1 }}
              transition={{ duration: 0.6, ease: EASE }}
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = `https://img.youtube.com/vi/${embed.id}/0.jpg`;
              }}
            />
            <PlayOverlay visible={hovered || alwaysShowPlay} />
          </div>
        )}

        {isYouTube && embedStarted && (
          <motion.div
            className="video-frame"
            style={{ paddingBottom: isShort ? '177.77%' : '56.25%' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${embed.id}?autoplay=1&controls=1&rel=0&modestbranding=1&playsinline=1`}
              title={video.title || 'Video'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            <a
              className="video-watch-link"
              href={
                isShort
                  ? `https://www.youtube.com/shorts/${embed.id}`
                  : `https://www.youtube.com/watch?v=${embed.id}`
              }
              target="_blank"
              rel="noopener noreferrer"
            >
              Watch on YouTube
            </a>
          </motion.div>
        )}

        {embed.type === 'vimeo' && (
          <div className="video-frame" style={{ paddingBottom: '56.25%' }}>
            <iframe src={embed.url} title={video.title || 'Video'} allowFullScreen />
          </div>
        )}

        {isDirect && (
          <div
            style={{ width: '100%', position: 'relative' }}
            onClick={toggleDirectPlayback}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggleDirectPlayback();
              }
            }}
          >
            <video
              ref={videoRef}
              src={url}
              className="video-element"
              loop
              playsInline
              preload="metadata"
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
            />
            <PlayOverlay visible={!playing && (hovered || alwaysShowPlay)} />

            <AnimatePresence>
              {(hovered || isTouch) && (
                <motion.div
                  className="video-actions"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.2 }}
                >
                  <button
                    className="btn-icon"
                    onClick={(event) => {
                      event.stopPropagation();
                      requestFullscreen();
                    }}
                    aria-label="Fullscreen"
                  >
                    <Maximize2 size={18} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {hasInfo && (
        <div className="video-info">
          <div>
            {video.title && <h3 className="video-title">{video.title}</h3>}
            {video.description && <p className="video-desc">{video.description}</p>}
          </div>

          {isAdmin && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn-icon"
                onClick={() => openModal('video', video)}
                aria-label="Edit video"
              >
                <Pencil size={18} />
              </button>
              <button
                className="btn-icon btn-icon-danger"
                onClick={handleDelete}
                aria-label="Delete video"
              >
                <Trash2 size={18} />
              </button>
            </div>
          )}
        </div>
      )}
    </TiltCard>
  );
}
