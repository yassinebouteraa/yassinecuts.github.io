import { useMemo } from 'react';
import { motion } from 'motion/react';
import { Film } from 'lucide-react';

import { usePortfolio } from '../context/PortfolioContext.jsx';
import { useAdmin } from '../context/AdminContext.jsx';
import { VIDEO_CATEGORIES } from '../config.js';
import { getEmbedInfo } from '../lib/embed.js';
import { LaptopShowreel } from './LaptopShowreel.jsx';
import { PhoneShowreel } from './PhoneShowreel.jsx';
import { Reveal } from './motion/Reveal.jsx';
import { TextReveal } from './motion/TextReveal.jsx';
import { SectionKicker } from './motion/SectionKicker.jsx';

export function Showreel() {
  const { videos, loading } = usePortfolio();
  const { isAdmin } = useAdmin();

  // Flattened into the fixed category order, so the TV cycles through a
  // stable, predictable sequence rather than raw database insert order.
  const ordered = useMemo(() => {
    const byCategory = new Map(VIDEO_CATEGORIES.map((category) => [category, []]));

    videos.forEach((video) => {
      const category = VIDEO_CATEGORIES.includes(video.category) ? video.category : 'Other';
      byCategory.get(category).push(video);
    });

    return VIDEO_CATEGORIES.flatMap((category) => byCategory.get(category));
  }, [videos]);

  // Vertical reels play on the phone, everything else on the TV. Orientation
  // comes from the URL: a YouTube /shorts/ link is the only format we can
  // know is 9:16 without loading the video, so direct uploads and Vimeo
  // links default to the TV.
  const [vertical, horizontal] = useMemo(() => {
    const isVertical = (video) => getEmbedInfo(video.video_url ?? video.videoUrl).type === 'youtube-short';
    return [ordered.filter(isVertical), ordered.filter((video) => !isVertical(video))];
  }, [ordered]);

  return (
    <section id="showreel" className="container section">
      <SectionKicker index={2} total={5} label="Showreel" />

      <Reveal className="section-head">
        <TextReveal as="h3" className="section-title" text="Featured Edits" gradientFrom={1} />
        <p className="text-muted">{loading ? 'Loading…' : `${videos.length} items`}</p>
      </Reveal>

      {!loading && vertical.length > 0 && <PhoneShowreel videos={vertical} />}
      {!loading && horizontal.length > 0 && <LaptopShowreel videos={horizontal} />}

      {!loading && ordered.length === 0 && (
        <motion.div
          className="glass-panel empty-state"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="empty-state-icon">
            <Film size={28} />
          </div>
          <p>Showreel loading soon</p>
          <p>{isAdmin ? 'Click “Add Video” above to start building the grid.' : 'New edits are on the way — check back shortly.'}</p>
        </motion.div>
      )}
    </section>
  );
}
