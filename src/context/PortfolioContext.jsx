import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getSupabase } from '../lib/supabase.js';

const PortfolioContext = createContext(null);

export function PortfolioProvider({ children }) {
  const [videos, setVideos] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const supabase = await getSupabase();
        const [videoRes, testimonialRes] = await Promise.all([
          supabase.from('videos').select('*').order('created_at', { ascending: false }),
          supabase.from('testimonials').select('*').order('created_at', { ascending: false }),
        ]);

        if (!active) return;
        if (videoRes.error) throw videoRes.error;
        if (testimonialRes.error) throw testimonialRes.error;

        setVideos(videoRes.data ?? []);
        setTestimonials(testimonialRes.data ?? []);
      } catch (err) {
        if (active) setError(err);
        console.error('Failed to load portfolio data:', err);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const addVideo = useCallback(async ({ title, description, videoUrl, category }) => {
    const supabase = await getSupabase();
    const { data, error: insertError } = await supabase
      .from('videos')
      .insert([{ title, description, video_url: videoUrl, category }])
      .select();

    if (insertError) throw insertError;
    setVideos((current) => [data[0], ...current]);
    return data[0];
  }, []);

  const updateVideo = useCallback(async (id, { title, description, videoUrl, category }) => {
    const supabase = await getSupabase();
    const { data, error: updateError } = await supabase
      .from('videos')
      .update({ title, description, video_url: videoUrl, category })
      .eq('id', id)
      .select();

    if (updateError) throw updateError;
    if (!data || data.length === 0) {
      throw new Error(
        'Update returned no rows — the Row Level Security policy is blocking this write. Make sure you are signed in as the admin user.'
      );
    }

    setVideos((current) => current.map((video) => (video.id === id ? data[0] : video)));
    return data[0];
  }, []);

  const removeVideo = useCallback(async (id) => {
    const supabase = await getSupabase();
    const previous = videos;
    setVideos((current) => current.filter((video) => video.id !== id));

    const { error: deleteError } = await supabase.from('videos').delete().eq('id', id);
    if (deleteError) {
      setVideos(previous); // put it back if the server refused
      throw deleteError;
    }
  }, [videos]);

  const addTestimonial = useCallback(async (payload) => {
    const supabase = await getSupabase();
    const { data, error: insertError } = await supabase.from('testimonials').insert([payload]).select();
    if (insertError) throw insertError;
    setTestimonials((current) => [data[0], ...current]);
    return data[0];
  }, []);

  const removeTestimonial = useCallback(async (id) => {
    const supabase = await getSupabase();
    const previous = testimonials;
    setTestimonials((current) => current.filter((item) => item.id !== id));

    const { error: deleteError } = await supabase.from('testimonials').delete().eq('id', id);
    if (deleteError) {
      setTestimonials(previous);
      throw deleteError;
    }
  }, [testimonials]);

  const value = useMemo(
    () => ({
      videos,
      testimonials,
      loading,
      error,
      addVideo,
      updateVideo,
      removeVideo,
      addTestimonial,
      removeTestimonial,
    }),
    [videos, testimonials, loading, error, addVideo, updateVideo, removeVideo, addTestimonial, removeTestimonial]
  );

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
}

export function usePortfolio() {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error('usePortfolio must be used inside <PortfolioProvider>');
  return ctx;
}
