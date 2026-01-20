/**
 * Mission Outreach Church (M.O.C) - Backend Server
 * This server handles form submissions, email notifications, and data management
 */

const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;

// Create media directories if they don't exist
async function ensureMediaDirs() {
    const videosDir = path.join(__dirname, 'media', 'videos');
    const photosDir = path.join(__dirname, 'media', 'photos');
    try {
        await fs.mkdir(videosDir, { recursive: true });
        await fs.mkdir(photosDir, { recursive: true });
        console.log('✓ Media directories ready');
    } catch (error) {
        console.error('Error creating media directories:', error);
    }
}

// Multer configuration for video uploads
const videoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'media', 'videos'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'video-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const videoUpload = multer({
    storage: videoStorage,
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only video files are allowed'));
        }
    }
});

// Multer configuration for photo uploads
const photoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'media', 'photos'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'photo-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const photoUpload = multer({
    storage: photoStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(__dirname));

// Database file path
const DATA_FILE = path.join(__dirname, 'moc-data.json');

// Simple in-memory admin session store (token => meta)
const adminSessions = new Map();

// Helper: extract token from request cookies
function getTokenFromReq(req) {
    const cookie = req.headers && req.headers.cookie;
    if (!cookie) return null;
    const match = cookie.split(';').map(c => c.trim()).find(c => c.startsWith('admin_token='));
    if (!match) return null;
    return match.split('=')[1];
}

// Middleware to require admin authentication
function requireAdmin(req, res, next) {
    // Try to get token from Authorization header first (Bearer token)
    const authHeader = req.headers.authorization;
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
    } else {
        // Fallback: try to get from cookies
        token = getTokenFromReq(req);
    }
    
    if (token && adminSessions.has(token)) return next();
    return res.status(401).json({ error: 'Unauthorized' });
}

// Initialize database file
async function initializeDatabase() {
    try {
        await fs.access(DATA_FILE);
    } catch {
        const initialData = {
            messages: [],
            videos: [],
            photos: [],
            lastUpdated: new Date().toISOString()
        };
        await fs.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2));
    }
}

// Load database
async function loadDatabase() {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading database:', error);
        return { messages: [], videos: [], photos: [] };
    }
}

// Save database
async function saveDatabase(data) {
    try {
        data.lastUpdated = new Date().toISOString();
        await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error saving database:', error);
    }
}

// Configure email service
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'shadrackithua75@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'your_password_here'
    }
});

// Send email notification
async function sendEmailNotification(messageData) {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER || 'shadrackithua75@gmail.com',
            to: 'shadrackithua75@gmail.com',
            subject: `New Message from M.O.C Website: ${messageData.subject}`,
            html: `
                <h2>New Contact Form Submission</h2>
                <p><strong>From:</strong> ${messageData.name}</p>
                <p><strong>Email:</strong> <a href="mailto:${messageData.email}">${messageData.email}</a></p>
                <p><strong>Phone:</strong> ${messageData.phone || 'Not provided'}</p>
                <p><strong>Subject:</strong> ${messageData.subject}</p>
                <hr>
                <p><strong>Message:</strong></p>
                <p>${messageData.message.replace(/\n/g, '<br>')}</p>
                <hr>
                <p><em>Submitted on: ${messageData.timestamp}</em></p>
            `
        };

        // Send to church email
        await transporter.sendMail(mailOptions);

        // Send confirmation to sender
        const confirmationEmail = {
            from: process.env.EMAIL_USER || 'shadrackithua75@gmail.com',
            to: messageData.email,
            subject: 'We Received Your Message - Mission Outreach Church',
            html: `
                <h2>Thank You for Contacting Us!</h2>
                <p>Dear ${messageData.name},</p>
                <p>We have received your message and will get back to you as soon as possible.</p>
                <p>If you need immediate assistance, please contact us:</p>
                <ul>
                    <li><strong>WhatsApp:</strong> +254 705 961 358</li>
                    <li><strong>Email:</strong> shadrackithua75@gmail.com</li>
                    <li><strong>Location:</strong> 150m from Mululini Market, Nairobi</li>
                </ul>
                <p>God bless!</p>
                <p><strong>Mission Outreach Church (M.O.C)</strong></p>
            `
        };

        await transporter.sendMail(confirmationEmail);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
}

// Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'Server is running', timestamp: new Date() });
});

// Submit contact message
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;

        // Validate required fields
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ 
                error: 'Missing required fields: name, email, subject, message' 
            });
        }

        const messageData = {
            id: Date.now(),
            name,
            email,
            phone: phone || '',
            subject,
            message,
            timestamp: new Date().toLocaleString(),
            read: false
        };

        // Load database, add message, and save
        const database = await loadDatabase();
        database.messages.push(messageData);
        await saveDatabase(database);

        // Send email notification
        await sendEmailNotification(messageData);

        res.json({ 
            success: true, 
            message: 'Message sent successfully',
            id: messageData.id 
        });
    } catch (error) {
        console.error('Error processing contact form:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all messages (admin only)
app.get('/api/messages', requireAdmin, async (req, res) => {
    try {
        const database = await loadDatabase();
        res.json(database.messages);
    } catch (error) {
        console.error('Error retrieving messages:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Mark message as read
app.patch('/api/messages/:id', requireAdmin, async (req, res) => {
    try {
        const messageId = parseInt(req.params.id);
        const database = await loadDatabase();
        
        const message = database.messages.find(m => m.id === messageId);
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        message.read = true;
        await saveDatabase(database);
        
        res.json({ success: true, message: 'Message marked as read' });
    } catch (error) {
        console.error('Error updating message:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete message (admin)
app.delete('/api/messages/:id', requireAdmin, async (req, res) => {
    try {
        const messageId = parseInt(req.params.id);
        const database = await loadDatabase();
        const idx = database.messages.findIndex(m => m.id === messageId);
        
        if (idx === -1) {
            return res.status(404).json({ error: 'Message not found' });
        }
        
        database.messages.splice(idx, 1);
        await saveDatabase(database);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Submit video
app.post('/api/videos', async (req, res) => {
    try {
        const { title, url, description, uploader } = req.body;

        if (!title || !url) {
            return res.status(400).json({ error: 'Title and URL are required' });
        }

        const videoData = {
            id: Date.now(),
            title,
            url,
            description: description || '',
            uploader: uploader || 'Anonymous',
            timestamp: new Date().toLocaleString(),
            approved: false
        };

        const database = await loadDatabase();
        database.videos.push(videoData);
        await saveDatabase(database);

        res.json({ 
            success: true, 
            message: 'Video submitted successfully',
            id: videoData.id 
        });
    } catch (error) {
        console.error('Error processing video:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get approved videos
app.get('/api/videos', async (req, res) => {
    try {
        const database = await loadDatabase();
        const approvedVideos = database.videos.filter(v => v.approved === true);
        res.json(approvedVideos);
    } catch (error) {
        console.error('Error retrieving videos:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin: Get all videos (including unapproved)
app.get('/api/admin/videos', requireAdmin, async (req, res) => {
    try {
        const database = await loadDatabase();
        res.json(database.videos || []);
    } catch (error) {
        console.error('Error retrieving all videos (admin):', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Approve a video (admin)
app.patch('/api/videos/:id/approve', requireAdmin, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const database = await loadDatabase();
        const v = database.videos.find(x => x.id === id);
        if (!v) return res.status(404).json({ error: 'Video not found' });
        v.approved = true;
        await saveDatabase(database);
        res.json({ success: true });
    } catch (err) {
        console.error('Error approving video:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete a video (admin)
app.delete('/api/videos/:id', requireAdmin, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const database = await loadDatabase();
        const idx = database.videos.findIndex(x => x.id === id);
        if (idx === -1) return res.status(404).json({ error: 'Video not found' });
        
        // Delete the file if it exists
        const videoFile = database.videos[idx].filePath;
        if (videoFile) {
            try {
                await fs.unlink(path.join(__dirname, videoFile));
            } catch (e) {
                console.log('File already deleted or not found');
            }
        }
        
        database.videos.splice(idx, 1);
        await saveDatabase(database);
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting video:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Upload video file (for local video storage)
app.post('/api/videos/upload', videoUpload.single('videoFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No video file provided' });
        }

        const { title, description, uploader } = req.body;
        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }

        const videoData = {
            id: Date.now(),
            title,
            description: description || '',
            uploader: uploader || 'Anonymous',
            timestamp: new Date().toLocaleString(),
            approved: false,
            filePath: path.join('media', 'videos', req.file.filename),
            fileSize: req.file.size,
            fileName: req.file.filename,
            isLocalFile: true
        };

        const database = await loadDatabase();
        database.videos.push(videoData);
        await saveDatabase(database);

        res.json({
            success: true,
            message: 'Video uploaded successfully',
            id: videoData.id,
            filePath: videoData.filePath
        });
    } catch (error) {
        console.error('Error uploading video:', error);
        res.status(500).json({ error: 'Error uploading video: ' + error.message });
    }
});

// Upload photo file (admin only)
app.post('/api/photos/upload', requireAdmin, photoUpload.single('photoFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No photo file provided' });
        }

        const { description, uploader } = req.body;

        const photoData = {
            id: Date.now(),
            name: req.file.originalname.replace(/\.[^/.]+$/, ''),
            description: description || '',
            uploader: uploader || 'Anonymous',
            timestamp: new Date().toLocaleString(),
            approved: false,
            filePath: path.join('media', 'photos', req.file.filename),
            fileSize: req.file.size,
            fileName: req.file.filename,
            isLocalFile: true
        };

        const database = await loadDatabase();
        database.photos.push(photoData);
        await saveDatabase(database);

        res.json({
            success: true,
            message: 'Photo uploaded successfully',
            id: photoData.id,
            filePath: photoData.filePath
        });
    } catch (error) {
        console.error('Error uploading photo:', error);
        res.status(500).json({ error: 'Error uploading photo: ' + error.message });
    }
});

// Submit photo (admin only)
app.post('/api/photos', requireAdmin, async (req, res) => {
    try {
        const { name, description, uploader, data } = req.body;

        if (!name || !data) {
            return res.status(400).json({ error: 'Photo name and data are required' });
        }

        const photoData = {
            id: Date.now(),
            name,
            description: description || '',
            uploader: uploader || 'Anonymous',
            timestamp: new Date().toLocaleString(),
            approved: false
        };

        const database = await loadDatabase();
        database.photos.push(photoData);
        await saveDatabase(database);

        res.json({ 
            success: true, 
            message: 'Photo submitted successfully',
            id: photoData.id 
        });
    } catch (error) {
        console.error('Error processing photo:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get approved photos
app.get('/api/photos', async (req, res) => {
    try {
        const database = await loadDatabase();
        const approvedPhotos = database.photos.filter(p => p.approved === true);
        res.json(approvedPhotos);
    } catch (error) {
        console.error('Error retrieving photos:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin: Get all photos (including unapproved)
app.get('/api/admin/photos', requireAdmin, async (req, res) => {
    try {
        const database = await loadDatabase();
        res.json(database.photos || []);
    } catch (error) {
        console.error('Error retrieving all photos (admin):', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Approve a photo (admin)
app.patch('/api/photos/:id/approve', requireAdmin, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const database = await loadDatabase();
        const p = database.photos.find(x => x.id === id);
        if (!p) return res.status(404).json({ error: 'Photo not found' });
        p.approved = true;
        await saveDatabase(database);
        res.json({ success: true });
    } catch (err) {
        console.error('Error approving photo:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete a photo (admin)
app.delete('/api/photos/:id', requireAdmin, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const database = await loadDatabase();
        const idx = database.photos.findIndex(x => x.id === id);
        if (idx === -1) return res.status(404).json({ error: 'Photo not found' });
        database.photos.splice(idx, 1);
        await saveDatabase(database);
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting photo:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get statistics
app.get('/api/stats', requireAdmin, async (req, res) => {
    try {
        const database = await loadDatabase();
        res.json({
            totalMessages: database.messages.length,
            unreadMessages: database.messages.filter(m => !m.read).length,
            totalVideos: database.videos.length,
            approvedVideos: database.videos.filter(v => v.approved).length,
            totalPhotos: database.photos.length,
            approvedPhotos: database.photos.filter(p => p.approved).length
        });
    } catch (error) {
        console.error('Error retrieving stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin login
app.post('/api/admin/login', express.json(), (req, res) => {
    const { user, password } = req.body || {};
    const ADMIN_USER = process.env.ADMIN_USER || 'admin';
    const ADMIN_PASS = process.env.ADMIN_PASS || 'letmein';
    if (user === ADMIN_USER && password === ADMIN_PASS) {
        const token = crypto.randomBytes(24).toString('hex');
        adminSessions.set(token, { created: Date.now() });
        // set cookie
        res.cookie('admin_token', token, { httpOnly: true, sameSite: 'lax' });
        return res.json({ success: true });
    }
    return res.status(401).json({ error: 'Invalid credentials' });
});

// Check auth status
app.get('/api/admin/auth', (req, res) => {
    const token = getTokenFromReq(req);
    if (token && adminSessions.has(token)) return res.json({ authenticated: true });
    return res.json({ authenticated: false });
});

// Start server
initializeDatabase().then(async () => {
    // Initialize media directories
    await ensureMediaDirs();
    
    // Serve admin UI page
    app.get('/admin', (req, res) => {
        res.sendFile(path.resolve(__dirname, 'admin.html'));
    });

    app.listen(PORT, () => {
        console.log(`\n🙏 Mission Outreach Church Backend Server`);
        console.log(`📍 Running on http://localhost:${PORT}`);
        console.log(`💼 Admin interface: http://localhost:${PORT}/admin`);
        console.log('\nAPI Endpoints:');
        console.log('  POST /api/contact - Submit contact form');
        console.log('  POST /api/videos/upload - Upload video file');
        console.log('  GET  /api/messages - Get all messages');
        console.log('  GET  /api/videos - Get approved videos');
        console.log('  GET  /api/photos - Get approved photos');
        console.log('  GET  /api/stats - Get statistics');
        console.log('\n');
    });
}).catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
});

module.exports = app;
