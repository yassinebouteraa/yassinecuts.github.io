import { useMemo } from 'react';
import { motion } from 'motion/react';

import { usePortfolio } from '../context/PortfolioContext.jsx';
import { useAdmin } from '../context/AdminContext.jsx';
import { VIDEO_CATEGORIES } from '../config.js';
import { VideoCard } from './VideoCard.jsx';
import { Reveal, Stagger } from './motion/Reveal.jsx';
import { TextReveal } from './motion/TextReveal.jsx';
import { revealVariants } from './motion/variants.js';

const cardVariants = revealVariants('up', { distance: 0.6, duration: 0.7 });

export function Showreel() {
  const { videos, loading } = usePortfolio();
  const { isAdmin } = useAdmin();

  // Group into the fixed category order, dropping any category with no videos.
  const groups = useMemo(() => {
    const byCategory = new Map(VIDEO_CATEGORIES.map((category) => [category, []]));

    videos.forEach((video) => {
      const category = VIDEO_CATEGORIES.includes(video.category) ? video.category : 'Other';
      byCategory.get(category).push(video);
    });

    return VIDEO_CATEGORIES.map((category) => ({ category, items: byCategory.get(category) })).filter(
      (group) => group.items.length > 0
    );
  }, [videos]);

  return (
    <section id="showreel" className="container section">
      <Reveal className="section-head">
        <TextReveal as="h3" className="section-title" text="Featured Edits" gradientFrom={1} />
        <p className="text-muted">{loading ? 'Loading…' : `${videos.length} items`}</p>
      </Reveal>

      {groups.map((group, index) => (
        <div className="video-category-group" key={group.category}>
          <Reveal as="h4" className="video-category-title" direction="left" distance={0.4} delay={index * 0.04}>
            {group.category}
          </Reveal>

          <Stagger className="video-grid" stagger={0.08}>
            {group.items.map((video) => (
              <VideoCard key={video.id} video={video} variants={cardVariants} />
            ))}
          </Stagger>
        </div>
      ))}

      {!loading && videos.length === 0 && (
        <motion.div
          className="glass-panel empty-state"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p>No videos added yet.</p>
          {isAdmin && <p className="text-muted">Click “Add Video” to start building your portfolio.</p>}
        </motion.div>
      )}
    </section>
  );
}
