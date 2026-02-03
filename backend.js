// Backend API handler for M.O.C Website
// This file handles all form submissions and data storage

// Simple in-memory database (can be replaced with actual backend)
const database = {
    messages: [],
    videos: [],
    photos: []
};
// Backend API base (server.js). Use relative base so frontend works
// whether served by the Node server or from a different host.
const API_BASE = '';

let currentGalleryIndex = 0;
let allGalleryItems = [];

// Load data from localStorage on startup
function loadData() {
    const savedData = localStorage.getItem('mocChurchData');
    if (savedData) {
        try {
            Object.assign(database, JSON.parse(savedData));
        } catch (e) {
            console.error('Error loading saved data:', e);
        }
    }
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('mocChurchData', JSON.stringify(database));
}

// Handle Contact Form Submission
async function handleContactFormSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = {
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        subject: document.getElementById('subject').value,
        message: document.getElementById('message').value
    };
    
    try {
        // Add to database
        database.messages.push(formData);
        saveData();
        
        // Send email notification
        await sendEmailNotification(formData);
        
        // Show success message
        const successMsg = document.getElementById('successMessage');
        successMsg.style.display = 'block';
        successMsg.scrollIntoView({ behavior: 'smooth' });
        
        // Reset form
        form.reset();
        
        // Hide success message after 5 seconds
        setTimeout(() => {
            successMsg.style.display = 'none';
        }, 5000);
        
        console.log('Message saved:', formData);
    } catch (error) {
        console.error('Error submitting contact form:', error);
        alert('Error sending message. Please try again or contact us directly.');
    }
}

// Send Email Notification (requires backend implementation)
async function sendEmailNotification(formData) {
    try {
        // This would typically call your backend API
        // For now, we'll just log it
        console.log('Email would be sent to: shadrackithua75@gmail.com');
        console.log('Message details:', formData);
        
        // In production, you would do something like:
        // const response = await fetch('/api/send-email', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(formData)
        // });
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

// Handle Video Upload Form
async function handleVideoUpload(event) {
    event.preventDefault();
    
    const form = event.target;
    const uploadMethod = document.querySelector('input[name="uploadMethod"]:checked').value;
    const title = document.getElementById('videoTitle').value;
    const description = document.getElementById('videoDescription').value;
    const uploader = document.getElementById('videoUploader').value || 'Anonymous';
    
    if (!title) {
        alert('Please enter a video title');
        return;
    }
    
    // Check authentication
    const token = sessionStorage.getItem('admin_token') || sessionStorage.getItem('user_token');
    if (!token) {
        alert('Please login to upload videos');
        document.getElementById('loginModal').style.display = 'flex';
        return;
    }

    try {
        if (uploadMethod === 'youtube') {
            // Handle YouTube URL submission
            const url = document.getElementById('videoUrl').value;
            if (!url) {
                alert('Please enter a YouTube URL');
                return;
            }
            
            const videoId = extractYouTubeVideoId(url);
            if (!videoId) {
                alert('Please enter a valid YouTube URL');
                return;
            }

            const videoData = {
                title,
                url,
                description,
                uploader
            };

            const response = await fetch('/api/videos', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(videoData)
            });

            if (!response.ok) throw new Error('Failed to submit video');

            form.reset();
            alert('Video submitted successfully! Awaiting admin approval.');
            console.log('Video submitted:', videoData);
        } else {
            // Handle file upload
            const videoFile = document.getElementById('videoFile').files[0];
            if (!videoFile) {
                alert('Please select a video file');
                return;
            }

            const formData = new FormData();
            formData.append('videoFile', videoFile);
            formData.append('title', title);
            formData.append('description', description);
            formData.append('uploader', uploader);

            const response = await fetch('/api/videos/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const result = await parseJSONSafe(response);
            if (!response.ok) throw new Error(result.error || 'Failed to upload video');

            form.reset();
            alert('Video uploaded successfully! Awaiting admin approval.');
            console.log('Video uploaded:', result);
        }
    } catch (error) {
        console.error('Error uploading video:', error);
        alert('Error: ' + error.message);
    }
}

// Extract YouTube video ID from URL
function extractYouTubeVideoId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// Display video in the videos grid (supports YouTube embeds and local mp4 files)
function displayVideo(videoData) {
    const container = document.getElementById('videosContainer');

    // Remove placeholder if it exists
    const placeholder = container.querySelector('.video-placeholder');
    if (placeholder) {
        placeholder.remove();
    }

    const videoCard = document.createElement('div');
    videoCard.className = 'video-card';
    videoCard.style.cursor = 'pointer';

    if (videoData.local) {
        // Local video file: show poster (if exists) or generic thumbnail
        const poster = videoData.poster || '';
        videoCard.innerHTML = `
            <div class="video-frame" style="position: relative; height:200px; background:#000;">
                ${poster ? `<img src="${poster}" alt="${escapeHtml(videoData.title)}" style="width:100%; height:100%; object-fit:cover;">` : ``}
                <div class="play-icon">▶</div>
            </div>
            <h3>${escapeHtml(videoData.title)}</h3>
            <p><strong>By:</strong> ${escapeHtml(videoData.uploader)}</p>
            ${videoData.description ? `<p>${escapeHtml(videoData.description)}</p>` : ''}
            <p style="font-size: 0.85rem; color: #999;">Added: ${videoData.timestamp}</p>
        `;

        videoCard.addEventListener('click', () => {
            // For local videos, open modal with the local URL
            const localItem = Object.assign({}, videoData);
            openGalleryModal(localItem, 'video');
        });
    } else if (videoData.videoId) {
        // YouTube video
        videoCard.innerHTML = `
            <div class="video-frame" style="position: relative; height:200px; background:#000;">
                <img src="https://img.youtube.com/vi/${videoData.videoId}/hqdefault.jpg" alt="${escapeHtml(videoData.title)}" style="width:100%; height:100%; object-fit:cover;">
                <div class="play-icon">▶</div>
            </div>
            <h3>${escapeHtml(videoData.title)}</h3>
            <p><strong>By:</strong> ${escapeHtml(videoData.uploader)}</p>
            ${videoData.description ? `<p>${escapeHtml(videoData.description)}</p>` : ''}
            <p style="font-size: 0.85rem; color: #999;">Added: ${videoData.timestamp}</p>
        `;

        videoCard.addEventListener('click', () => {
            openGalleryModal(videoData, 'video');
        });
    } else if (videoData.url) {
        // Generic URL (could be direct link to mp4)
        videoCard.innerHTML = `
            <div class="video-frame" style="position: relative; height:200px; background:#000;">
                <div class="play-icon">▶</div>
            </div>
            <h3>${escapeHtml(videoData.title)}</h3>
            <p><strong>By:</strong> ${escapeHtml(videoData.uploader)}</p>
            ${videoData.description ? `<p>${escapeHtml(videoData.description)}</p>` : ''}
            <p style="font-size: 0.85rem; color: #999;">Added: ${videoData.timestamp}</p>
        `;

        videoCard.addEventListener('click', () => {
            openGalleryModal(videoData, 'video');
        });
    }

    container.insertBefore(videoCard, container.firstChild);
}

// Handle Photo Upload
function handlePhotoUpload(event) {
    event.preventDefault();
    
    const form = event.target;
    const fileInput = document.getElementById('photoInput');
    const files = fileInput.files;
    const description = document.getElementById('photoDescription').value;
    const uploader = document.getElementById('photoUploader').value || 'Anonymous';
    
    if (files.length === 0) {
        alert('Please select photos to upload');
        return;
    }
    
    // Check authentication
    const token = sessionStorage.getItem('admin_token') || sessionStorage.getItem('user_token');
    if (!token) {
        alert('Please login to upload photos');
        document.getElementById('loginModal').style.display = 'flex';
        return;
    }
    
    let filesProcessed = 0;
    let uploadedCount = 0;
    
    // Upload each file to the backend
    for (let file of files) {
        const formData = new FormData();
        formData.append('photoFile', file);
        formData.append('description', description);
        formData.append('uploader', uploader);
        
        fetch('/api/photos/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        })
        .then(response => {
            filesProcessed++;
            if (!response.ok) {
                throw new Error('Upload failed');
            }
            return response.json();
        })
        .then(data => {
            uploadedCount++;
            
            // Show success message when all files are uploaded
            if (filesProcessed === files.length) {
                form.reset();
                alert(`${uploadedCount} photo(s) uploaded successfully and awaiting admin approval!`);
                // Refresh the gallery to show pending photos
                fetchServerData().then(displaySavedContent);
            }
        })
        .catch(error => {
            console.error('Error uploading photo:', error);
            filesProcessed++;
            if (filesProcessed === files.length) {
                alert(`Uploaded ${uploadedCount}/${files.length} photos. Some uploads may have failed.`);
            }
        });
    }
}

// Display photo in gallery
function displayPhoto(photoData) {
    const gallery = document.getElementById('photoGallery');
    
    // Remove placeholder if it exists
    const placeholder = gallery.querySelector('.gallery-placeholder');
    if (placeholder) {
        placeholder.remove();
    }
    
    const photoCard = document.createElement('div');
    photoCard.className = 'photo-card';
    photoCard.style.cursor = 'pointer';
    
    // Determine image source - use filePath for backend images, fall back to base64 data
    const imageSrc = photoData.filePath ? `/${photoData.filePath}` : photoData.data;
    
    photoCard.innerHTML = `
        <div class="photo-container">
            <img src="${imageSrc}" alt="${escapeHtml(photoData.name)}">
        </div>
        ${photoData.description ? `<p class="photo-description">${escapeHtml(photoData.description)}</p>` : ''}
        <p class="photo-uploader"><strong>By:</strong> ${escapeHtml(photoData.uploader)}</p>
        <p class="photo-date">${photoData.timestamp}</p>
    `;
    
    // Add click handler to open modal
    photoCard.addEventListener('click', () => {
        openGalleryModal(photoData, 'photo');
    });
    
    gallery.insertBefore(photoCard, gallery.firstChild);
}

// Escape HTML to prevent XSS attacks
// Escape HTML to prevent XSS attacks
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Load admin content from server with authentication
async function loadAdminContent() {
    try {
        const token = sessionStorage.getItem('admin_token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        
        const [videosRes, photosRes, messagesRes] = await Promise.all([
            fetch('/api/admin/videos', { headers }),
            fetch('/api/admin/photos', { headers }),
            fetch('/api/messages', { headers })
        ]);
        
        if (!videosRes.ok || !photosRes.ok || !messagesRes.ok) {
            console.error('Failed to load admin data');
            return;
        }
        
        const videos = await parseJSONSafe(videosRes);
        const photos = await parseJSONSafe(photosRes);
        const messages = await parseJSONSafe(messagesRes);
        
        database.videos = videos || [];
        database.photos = photos || [];
        database.messages = messages || [];
    } catch (error) {
        console.error('Error loading admin content:', error);
    }
}

// Update word count for contact message field
function updateWordCount() {
    const messageField = document.getElementById('message');
    const wordCount = document.getElementById('wordCount');
    
    if (!messageField || !wordCount) return;
    
    const words = messageField.value.trim().split(/\s+/).filter(word => word.length > 0).length;
    wordCount.textContent = Math.min(words, 500);
    
    if (words > 500) {
        const wordsArray = messageField.value.trim().split(/\s+/).slice(0, 500);
        messageField.value = wordsArray.join(' ');
    }
}

// Open gallery modal (supports photos, YouTube embeds, and local mp4 files)
function openGalleryModal(item, type) {
    const modal = document.getElementById('galleryModal');
    const modalImage = document.getElementById('modalImage');
    const modalVideo = document.getElementById('modalVideo');
    const modalIframe = document.getElementById('modalIframe');
    const modalTitle = document.getElementById('modalTitle');
    const modalDescription = document.getElementById('modalDescription');
    const modalUploader = document.getElementById('modalUploader');
    const modalDate = document.getElementById('modalDate');
    
    // Reset and hide all media elements
    modalImage.style.display = 'none';
    modalVideo.style.display = 'none';
    modalIframe.style.display = 'none';
    
    if (modalVideo) {
        modalVideo.pause();
        modalVideo.src = '';
        modalVideo.srcObject = null;
    }
    if (modalIframe) {
        modalIframe.src = '';
    }

    if (type === 'photo') {
        // Display photo - use filePath for backend images, fall back to base64 data
        const imageSrc = item.filePath ? `/${item.filePath}` : item.data;
        modalImage.src = imageSrc;
        modalImage.style.display = 'block';
        modalTitle.textContent = escapeHtml(item.name || 'Photo');
        modalDescription.textContent = escapeHtml(item.description || '');
        modalUploader.textContent = `By: ${escapeHtml(item.uploader || 'Anonymous')}`;
        modalDate.textContent = item.timestamp || '';
    } else if (type === 'video') {
        // Determine how to play the video
        if (item.local && item.url) {
            // Local MP4 file
            console.log('Loading local video:', item.url);
            modalVideo.src = item.url;
            modalVideo.style.display = 'block';
            
            // Wait for video to load metadata, then autoplay
            modalVideo.addEventListener('loadedmetadata', () => {
                console.log('Video metadata loaded, autoplaying...');
                modalVideo.play().catch(err => console.error('Autoplay failed:', err));
            }, { once: true });
            
            // Fallback: try to load immediately
            modalVideo.load();
            modalVideo.play().catch(err => {
                console.warn('Immediate autoplay blocked, user will click play');
            });
        } else if (item.videoId) {
            // YouTube embed
            console.log('Loading YouTube video:', item.videoId);
            modalIframe.src = `https://www.youtube.com/embed/${item.videoId}?autoplay=1&rel=0`;
            modalIframe.style.display = 'block';
        } else if (item.url) {
            // Generic URL (direct link to mp4 or stream)
            console.log('Loading generic video URL:', item.url);
            const ext = item.url.toLowerCase().substring(item.url.lastIndexOf('.'));
            if (ext === '.mp4' || ext === '.webm' || ext === '.ogv') {
                // Video file
                modalVideo.src = item.url;
                modalVideo.style.display = 'block';
                modalVideo.load();
                modalVideo.play().catch(err => console.warn('Autoplay blocked'));
            } else {
                // Assume it's a playable stream
                modalVideo.src = item.url;
                modalVideo.style.display = 'block';
                modalVideo.load();
            }
        }

        modalTitle.textContent = escapeHtml(item.title || 'Video');
        modalDescription.textContent = escapeHtml(item.description || '');
        modalUploader.textContent = `By: ${escapeHtml(item.uploader || 'Anonymous')}`;
        modalDate.textContent = item.timestamp || '';
    }

    modal.style.display = 'block';
}

// Close gallery modal
function closeGalleryModal() {
    const modal = document.getElementById('galleryModal');
    const modalVideo = document.getElementById('modalVideo');
    const modalIframe = document.getElementById('modalIframe');
    if (modalVideo) {
        modalVideo.pause && modalVideo.pause();
        modalVideo.removeAttribute('src');
    }
    if (modalIframe) {
        modalIframe.removeAttribute('src');
    }
    if (modal) modal.style.display = 'none';
}

// Display saved videos and photos from localStorage database
function displaySavedContent() {
    console.log('displaySavedContent called, database:', database);
    
    const container = document.getElementById('videosContainer');
    if (container) {
        console.log('Found videosContainer, displaying videos...');
        container.innerHTML = '';
        if (!database.videos || database.videos.length === 0) {
            container.innerHTML = '<div class="video-placeholder"><p>No videos yet. Share your church videos here!</p></div>';
        } else {
            const videos = database.videos.slice().reverse();
            console.log('Displaying', videos.length, 'videos');
            videos.forEach(v => {
                console.log('Displaying video:', v.title);
                displayVideo(v);
            });
        }
    }
    
    const gallery = document.getElementById('photoGallery');
    if (gallery) {
        gallery.innerHTML = '';
        if (!database.photos || database.photos.length === 0) {
            gallery.innerHTML = '<div class="gallery-placeholder"><p>No photos yet.</p></div>';
        } else {
            const photos = database.photos.slice().reverse();
            photos.forEach(p => displayPhoto(p));
        }
    }
    
    renderAdminLists();
}

// Try to fetch server-side DB and merge into local database
function fetchServerData() {
    console.log('Fetching server data from API endpoints...');
    return Promise.all([
        fetch('/api/videos').then(r => r.ok ? r.json() : []),
        fetch('/api/photos').then(r => r.ok ? r.json() : [])
    ])
    .then(([videos, photos]) => {
        console.log('Server data loaded: videos:', videos.length, 'photos:', photos.length);
        database.videos = Array.isArray(videos) ? videos : [];
        database.photos = Array.isArray(photos) ? photos : [];
        console.log('Final database state:', database);
    })
    .catch(err => {
        console.warn('Server data fetch failed:', err.message);
    });
}

// Initialize the application
function initializeApp() {
    // Load saved data
    loadData();

    // Attach form handlers
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactFormSubmit);
    }

    const videoForm = document.getElementById('videoUploadForm');
    if (videoForm) {
        videoForm.addEventListener('submit', handleVideoUpload);
    }

    const photoForm = document.getElementById('photoUploadForm');
    if (photoForm) {
        photoForm.addEventListener('submit', handlePhotoUpload);

        // Handle drag and drop for photo uploads
        const uploadArea = document.getElementById('photoUploadArea');
        const photoInput = document.getElementById('photoInput');

        if (uploadArea && photoInput) {
            uploadArea.addEventListener('click', () => photoInput.click());
            photoInput.addEventListener('change', () => {});
            uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); uploadArea.style.background = 'rgba(30, 60, 114, 0.15)'; uploadArea.style.borderColor = 'var(--accent-color)'; });
            uploadArea.addEventListener('dragleave', (e) => { e.preventDefault(); e.stopPropagation(); uploadArea.style.background = 'rgba(30, 60, 114, 0.03)'; uploadArea.style.borderColor = 'var(--primary-color)'; });
            uploadArea.addEventListener('drop', (e) => { e.preventDefault(); e.stopPropagation(); uploadArea.style.background = 'rgba(30, 60, 114, 0.03)'; uploadArea.style.borderColor = 'var(--primary-color)'; photoInput.files = e.dataTransfer.files; });
        }
    }

    // Attach word count listener
    const messageField = document.getElementById('message');
    if (messageField) {
        messageField.addEventListener('input', updateWordCount);
    }

    // Set up modal close handlers
    const modal = document.getElementById('galleryModal');
    const closeBtn = document.querySelector('.close-modal');
    if (closeBtn) closeBtn.addEventListener('click', closeGalleryModal);
    if (modal) {
        window.addEventListener('click', (event) => { if (event.target === modal) closeGalleryModal(); });
    }

    // Display saved videos and photos (merge with server DB if available)
    fetchServerData().then(displaySavedContent);
}

// Display saved videos and photos (refreshes the visible grids)
function displaySavedContent() {
    // Videos
    const container = document.getElementById('videosContainer');
    if (container) {
        container.innerHTML = '';
        if (!database.videos || database.videos.length === 0) {
            container.innerHTML = '<div class="video-placeholder"><p>No videos yet. Share your church videos here!</p></div>';
        } else {
            // show newest first
            const videos = database.videos.slice().reverse();
            videos.forEach(video => displayVideo(video));
        }
    }

    // Photos
    const gallery = document.getElementById('photoGallery');
    if (gallery) {
        gallery.innerHTML = '';
        if (!database.photos || database.photos.length === 0) {
            gallery.innerHTML = '<div class="gallery-placeholder"><p>No photos yet.</p></div>';
        } else {
            const photos = database.photos.slice().reverse();
            photos.forEach(photo => displayPhoto(photo));
        }
    }

    // Refresh admin lists if visible
    renderAdminLists();
}

// Admin: render lists into the admin panel
function renderAdminLists() {
    // Load server data first with auth token
    loadAdminContent();
    const videosList = document.getElementById('adminVideosList');
    const photosList = document.getElementById('adminPhotosList');

    if (videosList) {
        videosList.innerHTML = '';
        if (!database.videos || database.videos.length === 0) {
            videosList.innerHTML = '<p class="muted">No videos yet.</p>';
        } else {
            const rows = database.videos.slice().reverse();
            rows.forEach(v => {
                const item = document.createElement('div');
                item.className = 'admin-item';
                item.innerHTML = `
                    <div class="meta">
                        <h4>${escapeHtml(v.title || 'Untitled')}</h4>
                        <p>${escapeHtml(v.uploader || '')} • ${escapeHtml(v.timestamp || '')}</p>
                        <p class="muted">${escapeHtml(v.description || '')}</p>
                    </div>
                    <div class="controls">
                        <button class="btn btn-secondary" data-id="${v.id}" data-action="view">View</button>
                        ${v.approved ? '<span class="approved">Approved</span>' : `<button class="btn btn-primary" data-id="${v.id}" data-action="approve">Approve</button>`}
                        <button class="btn" data-id="${v.id}" data-action="delete">Delete</button>
                    </div>
                `;
                videosList.appendChild(item);
            });

            // attach handlers
            videosList.querySelectorAll('button[data-action]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = Number(btn.getAttribute('data-id'));
                    const action = btn.getAttribute('data-action');
                    if (action === 'approve') approveVideoById(id);
                    else if (action === 'delete') deleteVideoById(id);
                    else if (action === 'view') {
                        const v = database.videos.find(x => x.id === id);
                        if (v) openGalleryModal(v, 'video');
                    }
                });
            });
        }
    }

    if (photosList) {
        photosList.innerHTML = '';
        if (!database.photos || database.photos.length === 0) {
            photosList.innerHTML = '<p class="muted">No photos yet.</p>';
        } else {
            const rows = database.photos.slice().reverse();
            rows.forEach(p => {
                const item = document.createElement('div');
                item.className = 'admin-item';
                item.innerHTML = `
                    <div class="meta">
                        <h4>${escapeHtml(p.name || 'Photo')}</h4>
                        <p>${escapeHtml(p.uploader || '')} • ${escapeHtml(p.timestamp || '')}</p>
                    </div>
                    <div class="controls">
                        <button class="btn btn-secondary" data-id="${p.id}" data-action="view-photo">View</button>
                        <button class="btn btn-primary" data-id="${p.id}" data-action="approve-photo">Approve</button>
                        <button class="btn" data-id="${p.id}" data-action="delete-photo">Delete</button>
                    </div>
                `;
                photosList.appendChild(item);
            });

            photosList.querySelectorAll('button[data-action]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = Number(btn.getAttribute('data-id'));
                    const action = btn.getAttribute('data-action');
                    if (action === 'approve-photo') approvePhotoById(id);
                    else if (action === 'delete-photo') deletePhotoById(id);
                    else if (action === 'view-photo') {
                        const p = database.photos.find(x => x.id === id);
                        if (p) openGalleryModal(p, 'photo');
                    }
                });
            });
        }
    }
}

async function approveVideoById(id) {
    try {
        const token = sessionStorage.getItem('admin_token');
        const res = await fetch(`${API_BASE}/api/videos/${id}/approve`, {
            method: 'PATCH',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!res.ok) throw new Error('Server error');
        await fetchServerData();
        renderAdminLists();
        displaySavedContent();
        alert('Video approved');
    } catch (err) {
        console.error('approveVideoById error:', err);
        alert('Could not approve video (check server).');
    }
}

async function deleteVideoById(id) {
    if (!confirm('Delete this video? This cannot be undone.')) return;
    try {
        const token = sessionStorage.getItem('admin_token');
        const res = await fetch(`${API_BASE}/api/videos/${id}`, {
            method: 'DELETE',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!res.ok) throw new Error('Server error');
        await fetchServerData();
        renderAdminLists();
        displaySavedContent();
        alert('Video deleted');
    } catch (err) {
        console.error('deleteVideoById error:', err);
        alert('Could not delete video (check server).');
    }
}

async function approvePhotoById(id) {
    try {
        const token = sessionStorage.getItem('admin_token');
        const res = await fetch(`${API_BASE}/api/photos/${id}/approve`, {
            method: 'PATCH',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!res.ok) throw new Error('Server error');
        await fetchServerData();
        renderAdminLists();
        displaySavedContent();
        alert('Photo approved');
    } catch (err) {
        console.error('approvePhotoById error:', err);
        alert('Could not approve photo (check server).');
    }
}

async function deletePhotoById(id) {
    if (!confirm('Delete this photo? This cannot be undone.')) return;
    try {
        const token = sessionStorage.getItem('admin_token');
        const res = await fetch(`${API_BASE}/api/photos/${id}`, {
            method: 'DELETE',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!res.ok) throw new Error('Server error');
        await fetchServerData();
        renderAdminLists();
        displaySavedContent();
        alert('Photo deleted');
    } catch (err) {
        console.error('deletePhotoById error:', err);
        alert('Could not delete photo (check server).');
    }
}

function toggleAdminPanel() {
    console.log('toggleAdminPanel called');
    const panel = document.getElementById('adminPanel');
    if (!panel) {
        console.error('Admin panel not found');
        return;
    }
    if (panel.style.display === 'none' || !panel.style.display) {
        // Check server-side auth first
        fetch('/api/admin/auth').then(parseJSONSafe).then(data => {
            console.log('Auth check result:', data);
            if (data && data.authenticated) {
                panel.style.display = 'block';
                renderAdminLists();
            } else {
                showAdminLoginPanel();
            }
        }).catch((err) => {
            console.error('Auth check failed:', err);
            showAdminLoginPanel();
        });
    } else {
        panel.style.display = 'none';
    }
}

function showAdminLoginPanel() {
    const panel = document.getElementById('adminPanel');
    if (!panel) return;
    // Show the panel first
    panel.style.display = 'block';
    // create login container if not exists
    let login = document.getElementById('adminLoginContainer');
    if (!login) {
        login = document.createElement('div');
        login.id = 'adminLoginContainer';
        login.style.padding = '16px';
        login.innerHTML = `
            <h3>Admin Sign In</h3>
            <div style="display:flex;flex-direction:column;gap:8px;max-width:320px;">
                <input id="adminUser" placeholder="Username" />
                <input id="adminPass" placeholder="Password" type="password" />
                <div style="display:flex;gap:8px;">
                    <button id="adminLoginBtn" class="btn btn-primary">Sign In</button>
                    <button id="adminCancelBtn" class="btn">Cancel</button>
                </div>
                <div id="adminLoginMsg" class="muted"></div>
            </div>
        `;
        const inner = panel.querySelector('.admin-panel-inner') || panel;
        inner.insertBefore(login, inner.firstChild);

        document.getElementById('adminLoginBtn').addEventListener('click', async () => {
            const user = document.getElementById('adminUser').value;
            const password = document.getElementById('adminPass').value;
            const msg = document.getElementById('adminLoginMsg');
            msg.textContent = 'Signing in...';
            try {
                const res = await fetch('/api/admin/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user, password })
                });
                const data = await parseJSONSafe(res);
                if (!res.ok) throw new Error(data.error || 'Unauthorized');
                if (data.token) {
                    // Store token in sessionStorage
                    sessionStorage.setItem('admin_token', data.token);
                }
                msg.textContent = 'Signed in';
                // show admin panel
                panel.style.display = 'block';
                // remove login UI
                login.remove();
                renderAdminLists();
            } catch (err) {
                msg.textContent = 'Invalid credentials';
            }
        });

        document.getElementById('adminCancelBtn').addEventListener('click', () => {
            login.remove();
            panel.style.display = 'none';
        });
    } else {
        login.style.display = 'block';
    }
}

// Attach admin toggle handlers immediately (DOM should be ready)
function attachAdminHandlers() {
    const adminToggle = document.getElementById('adminToggle');
    const closeAdmin = document.getElementById('closeAdmin');
    console.log('attachAdminHandlers called, adminToggle:', adminToggle, 'closeAdmin:', closeAdmin);
    if (adminToggle) {
        adminToggle.removeEventListener('click', toggleAdminPanel);
        adminToggle.addEventListener('click', (e) => {
            e.preventDefault();
            toggleAdminPanel();
        });
        console.log('Admin toggle handler attached');
    }
    if (closeAdmin) {
        closeAdmin.removeEventListener('click', toggleAdminPanel);
        closeAdmin.addEventListener('click', toggleAdminPanel);
    }
}

// Attach handlers and initialize app
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOMContentLoaded event fired');
        attachAdminHandlers();
        initializeApp();
    });
} else {
    // DOM already loaded
    console.log('DOM already loaded, attaching handlers immediately');
    attachAdminHandlers();
    initializeApp();
}
