// ===================
// CONFIGURATION
// ===================
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
    
    // Delete physical file from Supabase Storage if it was uploaded there
    if (videoUrl && videoUrl.includes('storage.v1/object/public/videos/')) {
        const fileName = videoUrl.split('/').pop();
        await _supabase.storage.from('videos').remove([fileName]);
    }
}

async function syncDeleteTestimonial(id) {
    await _supabase.from('testimonials').delete().eq('id', id);
}

// ===================
// INITIALIZATION
// ===================
document.addEventListener("DOMContentLoaded", () => {
    // Dropzone logic
    setupDropzone('videoDropzone', 'videoFileInput', handleVideoFileSelect);
    setupDropzone('imageDropzone', 'imageFileInput', handleImageFileSelect);

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
});

function setupDropzone(dropzoneId, inputId, handleFn) {
    const dropzone = document.getElementById(dropzoneId);
    const input = document.getElementById(inputId);
    if (!dropzone || !input) return;

    dropzone.addEventListener('click', () => input.click());

    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'var(--primary-color)';
        dropzone.style.backgroundColor = 'rgba(99, 102, 241, 0.05)';
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.style.borderColor = 'var(--surface-border)';
        dropzone.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'var(--surface-border)';
        dropzone.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
        
        if (e.dataTransfer.files.length > 0) {
            const mockEvent = { target: { files: e.dataTransfer.files } };
            handleFn(mockEvent);
        }
    });
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
function handleVideoFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        state.pendingVideoFile = file;
        
        // Auto-fill title from filename
        const cleanName = file.name.split('.')[0].replace(/[_-]/g, ' ');
        document.getElementById('videoTitleInput').value = cleanName;
        
        document.getElementById('videoUploadPrompt').innerHTML = `
            <div style="background: rgba(99, 102, 241, 0.1); padding: 1rem; border-radius: 8px; width: 100%;">
                <i data-lucide="check-circle" style="color: var(--primary-color); width: 32px; height: 32px; margin-bottom: 0.5rem;"></i>
                <p style="font-weight: 600; font-size: 0.9rem;">${file.name}</p>
                <p style="font-size: 0.75rem; color: var(--text-muted);">Ready to upload to database</p>
                <button type="button" class="btn-icon" style="margin: 0.5rem auto 0; width: 30px; height: 30px;" onclick="event.stopPropagation(); state.pendingVideoFile=null; resetVideoPrompt();"><i data-lucide="x" style="width: 14px; height: 14px;"></i></button>
            </div>
        `;
        lucide.createIcons();
    }
}

function handleImageFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        state.pendingImageFile = file;
        document.getElementById('imageUploadPrompt').innerHTML = `
            <div style="background: rgba(236, 72, 153, 0.1); padding: 1rem; border-radius: 8px; width: 100%;">
                <i data-lucide="check-circle" style="color: var(--accent-color); width: 32px; height: 32px; margin-bottom: 0.5rem;"></i>
                <p style="font-weight: 600; font-size: 0.9rem;">${file.name}</p>
                <p style="font-size: 0.75rem; color: var(--text-muted);">Screenshot selected</p>
            </div>
        `;
        lucide.createIcons();
    }
}

function resetVideoPrompt() {
    document.getElementById('videoUploadPrompt').innerHTML = `
        <i data-lucide="upload" style="color: var(--text-muted); width: 48px; height: 48px;"></i>
        <div>
            <p style="font-weight: 600; color: var(--text-main);">Click to upload video</p>
            <p style="font-size: 0.85rem; color: var(--text-muted);">MP4, WebM or OGG (Unlimited Size)</p>
        </div>
    `;
    lucide.createIcons();
}

async function handleVideoFormSubmit(e) {
    e.preventDefault();
    
    const urlInput = document.getElementById('videoUrlInput').value;
    const title = document.getElementById('videoTitleInput').value || "New Edit";
    const desc = document.getElementById('videoDescInput').value || "";

    // If manual link was provided
    if (urlInput) {
        await submitVideoToDB(urlInput, title, desc);
        return;
    }

    // If a file was selected for database upload
    if (state.pendingVideoFile) {
        const file = state.pendingVideoFile;
        const progressContainer = document.getElementById('uploadProgressContainer');
        const progressBar = document.getElementById('uploadProgressBar');
        const progressText = document.getElementById('uploadProgressText');
        
        progressContainer.style.display = 'block';
        
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { data, error } = await _supabase.storage
                .from('videos')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false,
                    onUploadProgress: (progress) => {
                        const percent = Math.round((progress.loaded / progress.total) * 100);
                        progressBar.style.width = percent + '%';
                        progressText.innerText = `Uploading... ${percent}%`;
                    }
                });

            if (error) throw error;

            progressBar.style.width = '100%';
            progressText.innerText = `Finalizing...`;

            const { data: { publicUrl } } = _supabase.storage.from('videos').getPublicUrl(filePath);
            await submitVideoToDB(publicUrl, title, desc);
            
        } catch (err) {
            alert("Upload failed: " + err.message);
            console.error(err);
        } finally {
            progressContainer.style.display = 'none';
            state.pendingVideoFile = null;
        }
    } else {
        alert("Please select a file or paste a link.");
    }
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
    document.getElementById('videoUploadPrompt').innerHTML = `
        <i data-lucide="upload" style="color: var(--text-muted); width: 48px; height: 48px;"></i>
        <div>
            <p style="font-weight: 600; color: var(--text-main);">Click to upload video</p>
            <p style="font-size: 0.85rem; color: var(--text-muted);">MP4, WebM or OGG (Unlimited Size)</p>
        </div>
    `;
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

        container.insertAdjacentHTML('beforeend', `
            <div class="video-card animate-fade-in">
                <div class="video-thumbnail-container" style="position: relative;">
                    ${isEmbed ? `
                        <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; width: 100%;">
                            <iframe src="${embedInfo.url}" style="position: absolute; top:0; left:0; width:100%; height:100%; border:none;" allowfullscreen></iframe>
                        </div>
                    ` : `
                        <div onclick="togglePlayVideo(this)">
                            <video src="${url}" class="video-element" loop></video>
                            <div class="video-play-overlay">
                                <div style="background: var(--primary-color); width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(99,102, 241, 0.5);">
                                    <i data-lucide="play" fill="white" style="color:white; width: 28px; height: 28px;"></i>
                                </div>
                            </div>
                        </div>
                    `}
                    <div class="video-controls" style="position: absolute; bottom: 0; left: 0; right: 0; padding: 1rem; opacity: 0; transition: opacity 0.2s;">
                        ${!isEmbed ? `<button class="btn-icon" onclick="event.stopPropagation(); toggleFullscreen(this.parentElement.parentElement.querySelector('.video-element'))"><i data-lucide="maximize-2"></i></button>` : ''}
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

function getEmbedInfo(url) {
    if (!url) return { type: 'direct', url: '' };
    const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (ytMatch) return { type: 'youtube', url: `https://www.youtube.com/embed/${ytMatch[1]}` };
    const vimeoMatch = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/);
    if (vimeoMatch) return { type: 'vimeo', url: `https://player.vimeo.com/video/${vimeoMatch[1]}` };
    return { type: 'direct', url: url };
}

function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function closeModals(e) { if (e.target.classList.contains('modal-overlay')) document.querySelectorAll('.modal-overlay').forEach(el => el.style.display = 'none'); }

async function submitImageUpload(e) {
    e.preventDefault();
    const file = state.pendingImageFile;
    if (!file) {
        alert("Please select a screenshot first.");
        return;
    }
    
    try {
        const { data: uploadData, error: uploadError } = await _supabase.storage
            .from('videos') // Using the same bucket for simplicity, or change to 'testimonials' if configured
            .upload(`testimonials/${Date.now()}-${file.name}`, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = _supabase.storage.from('videos').getPublicUrl(uploadData.path);
        const { data, error } = await _supabase.from('testimonials').insert([{ type: 'image', image_url: publicUrl }]).select();
        
        if (error) throw error;

        state.testimonials.unshift(data[0]);
        document.getElementById('imageUploadForm').reset();
        resetImagePrompt();
        closeModal('uploadImageModal');
        renderApp();
    } catch (err) {
        alert("Image upload failed: " + err.message);
        console.error(err);
    } finally {
        state.pendingImageFile = null;
    }
}

function resetImagePrompt() {
    document.getElementById('imageUploadPrompt').innerHTML = `
        <i data-lucide="upload" style="color: var(--text-muted); width: 48px; height: 48px;"></i>
        <div>
            <p style="font-weight: 600; color: var(--text-main);">Click to upload screenshot</p>
            <p style="font-size: 0.85rem; color: var(--text-muted);">PNG, JPG or WebP</p>
        </div>
    `;
    lucide.createIcons();
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
