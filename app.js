// ===================
// CONFIGURATION
// ===================
const CLOUDINARY_CLOUD_NAME = 'dtxm5kfuk';
const CLOUDINARY_UPLOAD_PRESET = 'Ai Video';

const SUPABASE_URL = 'https://sorjwworxlwyxtipxgcb.supabase.co';
const SUPABASE_KEY = 'sb_publishable_AQDK0RKux_i5eTsjJSXFPw_dNDUP9xP'; 
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Simple State Object to hold data
let state = {
    isAdmin: false,
    videos: [],
    testimonials: [],
    pendingVideoFile: null,
    pendingImageFile: null
};

// ===================
// STORAGE LOGIC (Supabase)
// ===================
async function loadState() {
    try {
        // Fetch Videos
        const { data: videos, error: vError } = await _supabase
            .from('videos')
            .select('*')
            .order('created_at', { ascending: false });

        if (!vError && videos) {
            state.videos = videos;
        }

        // Fetch Testimonials
        const { data: testimonials, error: tError } = await _supabase
            .from('testimonials')
            .select('*')
            .order('created_at', { ascending: false });

        if (!tError && testimonials) {
            state.testimonials = testimonials;
        }

        renderApp();
    } catch (err) {
        console.error("Error loading from Supabase:", err);
    }
}

async function syncDeleteVideo(id, videoUrl) {
    // Delete from DB
    await _supabase.from('videos').delete().eq('id', id);
}

async function syncDeleteTestimonial(id) {
    await _supabase.from('testimonials').delete().eq('id', id);
}

// ===================
// INITIALIZATION
// ===================
document.addEventListener("DOMContentLoaded", () => {
    // Form Listeners
    const videoUploadForm = document.getElementById('videoUploadForm');
    if (videoUploadForm) videoUploadForm.addEventListener('submit', handleVideoFormSubmit);
    
    const imageUploadForm = document.getElementById('imageUploadForm');
    if (imageUploadForm) imageUploadForm.addEventListener('submit', submitImageUpload);
    
    const leaveReviewForm = document.getElementById('leaveReviewForm');
    if (leaveReviewForm) leaveReviewForm.addEventListener('submit', submitTextTestimonial);

    // Initial render
    loadState();
    initStatCounters();
    initCloudinary();
});

function initCloudinary() {
    const uploadBtn = document.getElementById('cloudinaryUploadBtn');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', () => {
            if (typeof cloudinary === 'undefined') {
                alert("Error: Cloudinary library not loaded!");
                return;
            }
            cloudinary.openUploadWidget({
                cloudName: CLOUDINARY_CLOUD_NAME,
                uploadPreset: CLOUDINARY_UPLOAD_PRESET,
                sources: ['local', 'url'],
                resourceType: 'video',
                multiple: false
            }, (error, result) => {
                if (!error && result && result.event === "success") {
                    document.getElementById('videoUrlInput').value = result.info.secure_url;
                    if (result.info.original_filename) {
                        document.getElementById('videoTitleInput').value = result.info.original_filename.split('_').join(' ');
                    }
                    document.getElementById('cloudinaryStatus').style.display = 'block';
                }
            });
        });
    }

    const imageUploadBtn = document.getElementById('cloudinaryImageUploadBtn');
    if (imageUploadBtn) {
        imageUploadBtn.addEventListener('click', () => {
            if (typeof cloudinary === 'undefined') {
                alert("Error: Cloudinary library not loaded!");
                return;
            }
            cloudinary.openUploadWidget({
                cloudName: CLOUDINARY_CLOUD_NAME,
                uploadPreset: CLOUDINARY_UPLOAD_PRESET,
                sources: ['local', 'url', 'camera'],
                resourceType: 'image',
                multiple: false
            }, (error, result) => {
                if (!error && result && result.event === "success") {
                    document.getElementById('imageUrlInput').value = result.info.secure_url;
                    document.getElementById('cloudinaryImageStatus').style.display = 'block';
                }
            });
        });
    }
}

// ===================
// ANIMATIONS
// ===================
function initStatCounters() {
    const statsBar = document.getElementById('statsBar');
    if (!statsBar) return;
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            const counters = document.querySelectorAll('.stat-counter');
            counters.forEach(counter => {
                const target = parseInt(counter.getAttribute('data-target'));
                const duration = 2000;
                let startTimestamp = null;
                const updateCounter = (timestamp) => {
                    if (!startTimestamp) startTimestamp = timestamp;
                    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                    const easeOutProgress = 1 - Math.pow(1 - progress, 4);
                    counter.innerText = Math.floor(easeOutProgress * target);
                    if (progress < 1) requestAnimationFrame(updateCounter);
                    else counter.innerText = target;
                };
                requestAnimationFrame(updateCounter);
            });
            observer.disconnect();
        }
    }, { threshold: 0.1 });
    observer.observe(statsBar);
}

// ===================
// UPLOAD LOGIC
// ===================
async function handleVideoFormSubmit(e) {
    if (e) e.preventDefault();
    
    const videoUrl = document.getElementById('videoUrlInput').value;
    if (!videoUrl) {
        alert("Please enter a Video URL or upload via Cloudinary.");
        return;
    }

    const title = document.getElementById('videoTitleInput').value || "New Edit";
    const desc = document.getElementById('videoDescInput').value || "";

    await submitVideoToDB(videoUrl, title, desc);
}

async function submitVideoToDB(videoUrl, title, desc) {
    const { data, error } = await _supabase
        .from('videos')
        .insert([{ title, description: desc, video_url: videoUrl }])
        .select();

    if (error) {
        alert("Database error: " + error.message);
        return;
    }

    state.videos.unshift(data[0]);
    document.getElementById('videoUploadForm').reset();
    if (document.getElementById('cloudinaryStatus')) {
        document.getElementById('cloudinaryStatus').style.display = 'none';
    }
    closeModal('uploadVideoModal');
    renderApp();
}

// ===================
// ADMIN TOGGLE
// ===================
async function hashString(str) {
    const msgBuffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function toggleAdmin() {
    if (!state.isAdmin) {
        const password = prompt("Enter Admin Password:");
        if (!password) return;
        const hashedInput = await hashString(password);
        const correctHash = "84a0693000844831479dbbf1e528739980aa243e53aa2e08fe2a65a420bd64ff";
        if (hashedInput !== correctHash) {
            alert("Incorrect password.");
            return;
        }
    }
    state.isAdmin = !state.isAdmin;
    document.body.classList.toggle('admin-mode', state.isAdmin);
    renderApp();
}

// ===================
// UI RENDERING
// ===================
function renderApp() {
    renderVideos();
    renderTestimonials();
    lucide.createIcons();
}

function renderVideos() {
    const container = document.getElementById('videoGridContainer');
    const emptyState = document.getElementById('emptyVideoState');
    document.getElementById('videoCountText').innerText = state.videos.length;
    container.innerHTML = '';
    if (state.videos.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    container.style.display = 'block';
    emptyState.style.display = 'none';

    state.videos.forEach(video => {
        const url = video.video_url || video.videoUrl;
        const embedInfo = getEmbedInfo(url);
        const isEmbed = embedInfo.type !== 'direct';

        let thumbnailHtml = '';
        if (embedInfo.type === 'youtube') {
            thumbnailHtml = `
                <div onclick="playYoutubeVideo(this, '${embedInfo.id}')" style="cursor: pointer; position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #000; border-radius: 12px; overflow: hidden; aspect-ratio: 16/9;">
                    <img src="https://img.youtube.com/vi/${embedInfo.id}/maxresdefault.jpg" onerror="this.src='https://img.youtube.com/vi/${embedInfo.id}/hqdefault.jpg';" style="width: 100%; height: auto; object-fit: contain;">
                    <div class="video-play-overlay">
                        <div style="background: var(--primary-color); width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(99,102, 241, 0.5);">
                            <i data-lucide="play" fill="white" style="color:white; width: 28px; height: 28px;"></i>
                        </div>
                    </div>
                </div>
            `;
        } else if (embedInfo.type === 'vimeo') {
            thumbnailHtml = `
                <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; width: 100%; border-radius: 12px;">
                    <iframe src="${embedInfo.url}" style="position: absolute; top:0; left:0; width:100%; height:100%; border:none;" allowfullscreen></iframe>
                </div>
            `;
        } else {
            thumbnailHtml = `
                <div onclick="togglePlayVideo(this)">
                    <video src="${url}" class="video-element" loop></video>
                    <div class="video-play-overlay">
                        <div style="background: var(--primary-color); width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(99,102, 241, 0.5);">
                            <i data-lucide="play" fill="white" style="color:white; width: 28px; height: 28px;"></i>
                        </div>
                    </div>
                </div>
            `;
        }

        container.insertAdjacentHTML('beforeend', `
            <div class="video-card animate-fade-in">
                <div class="video-thumbnail-container" style="position: relative;">
                    ${thumbnailHtml}
                    <div class="video-controls" style="position: absolute; bottom: 0; left: 0; right: 0; padding: 1rem; opacity: 0; transition: opacity 0.2s; pointer-events: none;">
                        ${!isEmbed ? `<button class="btn-icon" style="pointer-events: auto;" onclick="event.stopPropagation(); toggleFullscreen(this.parentElement.parentElement.querySelector('.video-element'))"><i data-lucide="maximize-2"></i></button>` : ''}
                    </div>
                </div>
                <div class="video-info">
                    <div style="display: flex; justify-content: space-between;">
                        <div>
                            <h3 class="video-title">${video.title}</h3>
                            <p class="video-desc">${video.description}</p>
                        </div>
                        ${state.isAdmin ? `<button class="btn-icon btn-icon-danger" onclick="deleteVideo('${video.id}', '${url}')"><i data-lucide="trash-2"></i></button>` : ''}
                    </div>
                </div>
            </div>
        `);
    });
}

function renderTestimonials() {
    const container = document.getElementById('testimonialGridContainer');
    const emptyState = document.getElementById('emptyTestimonialState');
    container.innerHTML = '';
    if (state.testimonials.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    container.style.display = 'block';
    emptyState.style.display = 'none';
    state.testimonials.forEach(t => {
        const isAdminBtn = state.isAdmin ? `<div style="position: absolute; top: 1rem; right: 1rem;"><button class="btn-icon btn-icon-danger" onclick="deleteTestimonial('${t.id}')"><i data-lucide="trash-2"></i></button></div>` : '';
        let content = t.type === 'text' ? `<div style="padding: 2.5rem;"><p>"${t.text}"</p><p><strong>${t.name}</strong></p></div>` : `<img src="${t.image_url || t.imageUrl}" class="testimonial-img" />`;
        container.insertAdjacentHTML('beforeend', `<div class="video-card" style="position: relative; height: 100%;">${content}${isAdminBtn}</div>`);
    });
}

// ===================
// HELPERS
// ===================
function deleteVideo(id, url) {
    if (confirm('Delete this video from database?')) {
        state.videos = state.videos.filter(v => v.id !== id);
        syncDeleteVideo(id, url);
        renderApp();
    }
}

function deleteTestimonial(id) {
    if (confirm('Delete this review?')) {
        state.testimonials = state.testimonials.filter(t => t.id !== id);
        syncDeleteTestimonial(id);
        renderApp();
    }
}

function togglePlayVideo(el) {
    const v = el.querySelector('.video-element');
    const o = el.querySelector('.video-play-overlay');
    if (v.paused) { v.play(); o.style.opacity = "0"; }
    else { v.pause(); o.style.opacity = ""; }
}

function toggleFullscreen(v) {
    if (v.requestFullscreen) v.requestFullscreen();
    else if (v.webkitRequestFullscreen) v.webkitRequestFullscreen();
}

function playYoutubeVideo(el, id) {
    el.innerHTML = `
        <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; width: 100%; border-radius: 12px;">
            <iframe src="https://www.youtube.com/embed/${id}?autoplay=1&controls=1&rel=0&modestbranding=1&playsinline=1" style="position: absolute; top:0; left:0; width:100%; height:100%; border:none;" allowfullscreen autoplay playsinline></iframe>
        </div>
    `;
    el.style.aspectRatio = "unset";
    el.style.background = "none";
    el.style.cursor = "default";
    el.onclick = null;
}

function getEmbedInfo(url) {
    if (!url) return { type: 'direct', url: '', id: null };
    const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (ytMatch) return { type: 'youtube', url: `https://www.youtube.com/embed/${ytMatch[1]}`, id: ytMatch[1] };
    const vimeoMatch = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/);
    if (vimeoMatch) return { type: 'vimeo', url: `https://player.vimeo.com/video/${vimeoMatch[1]}`, id: vimeoMatch[1] };
    return { type: 'direct', url: url, id: null };
}

function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function closeModals(e) { if (e.target.classList.contains('modal-overlay')) document.querySelectorAll('.modal-overlay').forEach(el => el.style.display = 'none'); }

async function submitImageUpload(e) {
    if (e) e.preventDefault();
    
    const imageUrl = document.getElementById('imageUrlInput').value;
    if (!imageUrl) {
        alert("Please provide an Image URL or upload one first.");
        return;
    }
    
    try {
        const { data, error } = await _supabase.from('testimonials').insert([{ type: 'image', image_url: imageUrl }]).select();
        
        if (error) throw error;

        state.testimonials.unshift(data[0]);
        document.getElementById('imageUploadForm').reset();
        if (document.getElementById('cloudinaryImageStatus')) {
            document.getElementById('cloudinaryImageStatus').style.display = 'none';
        }
        closeModal('uploadImageModal');
        renderApp();
    } catch (err) {
        alert("Database error: " + err.message);
        console.error(err);
    }
}

async function submitTextTestimonial(e) {
    e.preventDefault();
    const n = document.getElementById('reviewerNameInput').value;
    const r = document.getElementById('reviewerRoleInput').value;
    const t = document.getElementById('reviewerTextInput').value;
    const { data, error } = await _supabase.from('testimonials').insert([{ type: 'text', name: `${n} - ${r}`, text: t }]).select();
    if (!error) state.testimonials.unshift(data[0]);
    document.getElementById('leaveReviewForm').reset();
    closeModal('leaveReviewModal');
    renderApp();
}
