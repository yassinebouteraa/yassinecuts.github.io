import { motion } from 'motion/react';
import { MessageSquare, Plus, Trash2 } from 'lucide-react';

import { useAdmin } from '../context/AdminContext.jsx';
import { useModal } from '../context/ModalContext.jsx';
import { usePortfolio } from '../context/PortfolioContext.jsx';
import { Reveal, Stagger } from './motion/Reveal.jsx';
import { TextReveal } from './motion/TextReveal.jsx';
import { TiltCard } from './motion/TiltCard.jsx';
import { MagneticButton } from './motion/MagneticButton.jsx';
import { revealVariants } from './motion/variants.js';

const cardVariants = revealVariants('scale', { duration: 0.7 });

function TestimonialCard({ item, ...rest }) {
  const { isAdmin } = useAdmin();
  const { removeTestimonial } = usePortfolio();

  async function handleDelete() {
    if (!window.confirm('Delete this review?')) return;
    try {
      await removeTestimonial(item.id);
    } catch (error) {
      window.alert(`Could not delete: ${error.message}`);
    }
  }

  return (
    <TiltCard className="video-card" max={5} lift={-6} style={{ position: 'relative' }} {...rest}>
      {item.type === 'text' ? (
        <div className="testimonial-text">
          <p>“{item.text}”</p>
          <p>
            <strong>{item.name}</strong>
          </p>
        </div>
      ) : (
        <img
          className="testimonial-img"
          src={item.image_url ?? item.imageUrl}
          alt={`Client review from ${item.name ?? 'a client'}`}
          loading="lazy"
        />
      )}

      {isAdmin && (
        <div className="testimonial-delete">
          <button className="btn-icon btn-icon-danger" onClick={handleDelete} aria-label="Delete review">
            <Trash2 size={18} />
          </button>
        </div>
      )}
    </TiltCard>
  );
}

export function Testimonials() {
  const { testimonials, loading } = usePortfolio();
  const { isAdmin } = useAdmin();
  const { openModal } = useModal();

  return (
    <section id="testimonials" className="container section">
      <Reveal className="section-head">
        <TextReveal
          as="h3"
          className="section-title"
          text="Client Review Screenshots"
          gradientFrom={1}
        />

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <MagneticButton
            className="btn-primary btn-subtle"
            onClick={() => openModal('review')}
            strength={0.2}
          >
            <MessageSquare size={16} />
            <span>Leave a Review</span>
          </MagneticButton>

          {isAdmin && (
            <MagneticButton
              className="btn-primary"
              style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
              onClick={() => openModal('screenshot')}
              strength={0.2}
            >
              <Plus size={16} />
              <span>Add Screenshot</span>
            </MagneticButton>
          )}
        </div>
      </Reveal>

      <Stagger className="video-grid" stagger={0.07}>
        {testimonials.map((item) => (
          <TestimonialCard key={item.id} item={item} variants={cardVariants} />
        ))}
      </Stagger>

      {!loading && testimonials.length === 0 && (
        <motion.div
          className="glass-panel empty-state"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p>No testimonials added yet.</p>
          {isAdmin && <p className="text-muted">Click “Add Screenshot” to showcase client feedback.</p>}
        </motion.div>
      )}
    </section>
  );
}
