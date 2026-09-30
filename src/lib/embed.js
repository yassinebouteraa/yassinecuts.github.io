// Works out how a stored video URL should be rendered:
// a YouTube thumbnail, a YouTube Short, a Vimeo iframe, or a raw <video>.
export function getEmbedInfo(url) {
  if (!url) return { type: 'direct', url: '', id: null };

  const shortsMatch = url.match(/youtube\.com\/shorts\/([^"&?/\s]{11})/);
  if (shortsMatch) {
    return { type: 'youtube-short', url: `https://www.youtube.com/embed/${shortsMatch[1]}`, id: shortsMatch[1] };
  }

  const ytMatch = url.match(
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
  );
  if (ytMatch) {
    return { type: 'youtube', url: `https://www.youtube.com/embed/${ytMatch[1]}`, id: ytMatch[1] };
  }

  const vimeoMatch = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/);
  if (vimeoMatch) {
    return { type: 'vimeo', url: `https://player.vimeo.com/video/${vimeoMatch[1]}`, id: vimeoMatch[1] };
  }

  return { type: 'direct', url, id: null };
}
