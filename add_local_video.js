/*
 Script: add_local_video.js
 Usage: node add_local_video.js "media/videos/kyangungi m.o.c 2.mp4" "Kyangungi M.O.C 2"
 This script adds a local video entry to `moc-data.json` so the frontend will display it.
 */

const fs = require('fs');
const path = require('path');

if (process.argv.length < 4) {
  console.error('Usage: node add_local_video.js <relative-path-to-video> <title> [uploader]');
  process.exit(1);
}

const videoPath = process.argv[2]; // relative to project root, e.g. media/videos/yourvideo.mp4
const title = process.argv[3];
const uploader = process.argv[4] || 'Local Upload';

const DATA_FILE = path.join(__dirname, 'moc-data.json');

async function main() {
  try {
    const absVideoPath = path.join(__dirname, videoPath);
    if (!fs.existsSync(absVideoPath)) {
      console.error('Video file not found at:', absVideoPath);
      process.exit(2);
    }

    let db = { messages: [], videos: [], photos: [] };
    if (fs.existsSync(DATA_FILE)) {
      db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }

    const id = Date.now();
    const videoEntry = {
      id,
      title,
      url: '/' + videoPath.replace(/\\\\/g, '/'),
      local: true,
      description: '',
      uploader,
      timestamp: new Date().toLocaleString(),
      approved: true
    };

    db.videos = db.videos || [];
    db.videos.push(videoEntry);

    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf8');
    console.log('Added local video entry to', DATA_FILE);
    console.log('Video entry id:', id);
  } catch (err) {
    console.error('Error:', err);
    process.exit(3);
  }
}

main();
