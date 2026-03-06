// Simple State Object to hold data
let state = {
    isAdmin: false, // Default to FALSE so visitors don't see admin controls
    videos: [
        {
            id: '1',
            title: 'Cinematic Travel Vlog',
            description: 'A beautiful journey through the mountains of Switzerland.',
            videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
        },
        {
            id: '2',
            title: 'Neon City Nightscape',
            description: 'Urban exploration and cinematic lighting tests in Tokyo.',
            videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
        },
        {
            id: '3',
            title: 'Action Sports Highlight',
            description: 'Fast-paced editing techniques for extreme sports.',
            videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4'
        }
    ],
    testimonials: [],

    // Upload pointers
    pendingVideoFile: null,
    pendingImageFile: null
};

// ===================
// INITIALIZATION
// ===================
document.addEventListener("DOMContentLoaded", () => {
    // Admin Toggle Listener
    document.getElementById('adminToggleBtn').addEventListener('click', toggleAdmin);

    // Upload Forms Listeners
    document.getElementById('videoUploadForm').addEventListener('submit', submitVideoUpload);
    document.getElementById('imageUploadForm').addEventListener('submit', submitImageUpload);

    // Dropzone click listeners
    document.getElementById('videoDropzone').addEventListener('click', () => document.getElementById('videoFileInput').click());
    document.getElementById('imageDropzone').addEventListener('click', () => document.getElementById('imageFileInput').click());

    // Initial render
    renderApp();
});


// ===================
// ADMIN TOGGLE LOGIC
// ===================
async function hashString(str) {
    const msgBuffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function toggleAdmin() {
    // If trying to turn admin mode ON, ask for password
    if (!state.isAdmin) {
        const password = prompt("Enter Admin Password:");

        if (!password) return; // User canceled

        try {
            // Hash the password they entered using SHA-256
            const hashedInput = await hashString(password);

            // This is the one-way hash for your new password, so your password is NOT stored in plaintext!
            const correctHash = "84a0693000844831479dbbf1e528739980aa243e53aa2e08fe2a65a420bd64ff";

            if (hashedInput !== correctHash) {
                alert("Incorrect password.");
                return;
            }
        } catch (e) {
            console.error("Encryption check failed:", e);
            alert("Security check failed. You must access this site over HTTPS.");
            return;
        }
    }

    state.isAdmin = !state.isAdmin;

    const bodyObj = document.body;
    const adminToggleIcon = document.getElementById('adminToggleIcon');
    const adminToggleBtn = document.getElementById('adminToggleBtn');

    if (state.isAdmin) {
        bodyObj.classList.add('admin-mode');
        adminToggleBtn.style.color = "var(--accent-color)";
        adminToggleIcon.setAttribute("data-lucide", "unlock");
    } else {
        bodyObj.classList.remove('admin-mode');
        adminToggleBtn.style.color = "var(--text-muted)";
        adminToggleIcon.setAttribute("data-lucide", "lock");
    }

    // Force lucide to re-render the replaced icon
    lucide.createIcons();
    renderApp(); // Rerender to show/hide admin actions in cards
}


// ===================
// RENDERING UI
// ===================
function renderApp() {
    renderVideos();
    renderTestimonials();
    lucide.createIcons(); // Instatiate icons bound to dynamically created HTML elements
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

    container.style.display = 'block'; /* will fallback gracefully to column count masonry layout defined in CSS */
    emptyState.style.display = 'none';

    state.videos.forEach(video => {
        const cardHTML = `
        <div class="video-card animate-fade-in" onmouseenter="this.querySelector('.video-controls').style.opacity=1;" onmouseleave="this.querySelector('.video-controls').style.opacity=0;">
            <div class="video-thumbnail-container" style="cursor: pointer;" onclick="togglePlayVideo(this)">
                <video src="${video.videoUrl}" class="video-element" loop></video>
                <div class="video-play-overlay">
                    <div style="background: var(--primary-color); width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(99, 102, 241, 0.5);">
                        <i data-lucide="play" fill="white" style="color:white; width: 28px; height: 28px; margin-left: 4px;"></i>
                    </div>
                </div>

                <!-- Hover Controls -->
                <div class="video-controls" style="position: absolute; bottom: 0; left: 0; right: 0; padding: 1rem; background: linear-gradient(transparent, rgba(0,0,0,0.8)); display: flex; justify-content: flex-end; gap: 0.5rem; opacity: 0; transition: opacity 0.2s;">
                    <button class="btn-icon" style="width: 32px; height: 32px;" onclick="event.stopPropagation(); toggleFullscreen(this.parentElement.parentElement.querySelector('.video-element'))">
                        <i data-lucide="maximize-2" style="width: 16px; height: 16px;"></i>
                    </button>
                </div>
            </div>
            
            <div class="video-info">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <h3 class="video-title">${video.title}</h3>
                        <p class="video-desc">${video.description}</p>
                    </div>
                    ${state.isAdmin ? `
                    <div style="display: flex; gap: 0.5rem; flex-shrink: 0;">
                        <button class="btn-icon btn-icon-danger" style="border: none; background: transparent;" onclick="deleteVideo('${video.id}')" title="Delete this video">
                            <i data-lucide="trash-2" style="width: 18px; height: 18px;"></i>
                        </button>
                    </div>
                    ` : ''}
                </div>
            </div>
        </div>
        `;
        container.insertAdjacentHTML('beforeend', cardHTML);
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

    state.testimonials.forEach(testimonial => {
        const adminDeleteBtnHTML = state.isAdmin ? `
        <div style="position: absolute; top: 1rem; right: 1rem; background: rgba(0,0,0,0.5); border-radius: 50%; padding: 0.25rem;">
            <button class="btn-icon btn-icon-danger" style="border: none; background: transparent; width: 32px; height: 32px;" onclick="deleteTestimonial('${testimonial.id}')">
                <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
            </button>
        </div>` : '';

        const cardHTML = `
        <div class="video-card animate-fade-in" style="cursor: pointer; position: relative; overflow: hidden;">
            <img src="${testimonial.imageUrl}" alt="Client Testimonial" class="testimonial-img" />
            ${adminDeleteBtnHTML}
        </div>
        `;
        container.insertAdjacentHTML('beforeend', cardHTML);
    });
}


// ===================
// ACTIONS & LOGIC
// ===================
function deleteVideo(id) {
    if (confirm('Are you sure you want to delete this video?')) {
        state.videos = state.videos.filter(v => v.id !== id);
        renderApp();
    }
}

function deleteTestimonial(id) {
    if (confirm('Are you sure you want to delete this screenshot?')) {
        state.testimonials = state.testimonials.filter(t => t.id !== id);
        renderApp();
    }
}

function togglePlayVideo(containerElement) {
    const video = containerElement.querySelector('.video-element');
    const overlay = containerElement.querySelector('.video-play-overlay');

    if (video.paused) {
        video.play();
        overlay.style.opacity = "0";
    } else {
        video.pause();
        overlay.style.opacity = ""; // Give it back to css hover rules
    }
}

function toggleFullscreen(videoElement) {
    if (videoElement.requestFullscreen) {
        videoElement.requestFullscreen();
    } else if (videoElement.webkitRequestFullscreen) {
        videoElement.webkitRequestFullscreen();
    }
}


// ===================
// MODALS LOGIC
// ===================
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

function closeModals(event) {
    // Closes any overlay mode if clicking on the background dim overlay
    if (event.target.classList.contains('modal-overlay')) {
        document.querySelectorAll('.modal-overlay').forEach(el => el.style.display = 'none');
    }
}


// ===================
// UPLOAD LOGIC
// ===================
function handleVideoFileSelect(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('video/')) {
        state.pendingVideoFile = file;
        const prompt = document.getElementById('videoUploadPrompt');

        // Show success UI inside dropzone
        prompt.innerHTML = `
            <i data-lucide="check-circle" style="color: var(--primary-color); width: 48px; height: 48px;"></i>
            <div>
                <p style="font-weight: 600; color: var(--text-main);">${file.name}</p>
                <p style="font-size: 0.85rem; color: var(--text-muted);">${(file.size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
        `;
        // Put filename automatically in title
        document.getElementById('videoTitleInput').value = file.name.split('.')[0];
        lucide.createIcons();
    }
}

function submitVideoUpload(e) {
    e.preventDefault();
    if (!state.pendingVideoFile) {
        alert("Please select a video file first.");
        return;
    }

    const title = document.getElementById('videoTitleInput').value;
    const desc = document.getElementById('videoDescInput').value;

    // Create Temporary Local url
    const videoUrl = URL.createObjectURL(state.pendingVideoFile);

    state.videos.unshift({
        id: Date.now().toString(),
        title: title,
        description: desc,
        videoUrl: videoUrl
    });

    // Reset Form
    document.getElementById('videoUploadForm').reset();
    state.pendingVideoFile = null;
    document.getElementById('videoUploadPrompt').innerHTML = `
        <i data-lucide="upload" style="color: var(--text-muted); width: 48px; height: 48px;"></i>
        <div>
            <p style="font-weight: 600; color: var(--text-main);">Click to upload video</p>
            <p style="font-size: 0.85rem; color: var(--text-muted);">MP4, WebM or OGG</p>
        </div>
    `;

    closeModal('uploadVideoModal');
    renderApp();
}

function handleImageFileSelect(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        state.pendingImageFile = file;
        const prompt = document.getElementById('imageUploadPrompt');

        prompt.innerHTML = `
            <i data-lucide="check-circle" style="color: var(--primary-color); width: 48px; height: 48px;"></i>
            <div>
                <p style="font-weight: 600; color: var(--text-main);">${file.name}</p>
                <p style="font-size: 0.85rem; color: var(--text-muted);">${(file.size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
        `;
        lucide.createIcons();
    }
}

function submitImageUpload(e) {
    e.preventDefault();
    if (!state.pendingImageFile) {
        alert("Please select an image file first.");
        return;
    }

    // Create Temporary Local url
    const imageUrl = URL.createObjectURL(state.pendingImageFile);

    state.testimonials.unshift({
        id: Date.now().toString(),
        imageUrl: imageUrl
    });

    // Reset Form
    document.getElementById('imageUploadForm').reset();
    state.pendingImageFile = null;
    document.getElementById('imageUploadPrompt').innerHTML = `
        <i data-lucide="upload" style="color: var(--text-muted); width: 48px; height: 48px;"></i>
        <div>
            <p style="font-weight: 600; color: var(--text-main);">Click to upload screenshot</p>
            <p style="font-size: 0.85rem; color: var(--text-muted);">PNG, JPG or WebP</p>
        </div>
    `;

    closeModal('uploadImageModal');
    renderApp();
}
