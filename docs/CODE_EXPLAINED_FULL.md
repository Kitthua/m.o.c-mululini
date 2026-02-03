# Complete Code Explanation — M.O.C (Full)

This document explains every important code file in this repository in detail. It's meant to help you read, understand, and extend the project.

---

## Project overview

Mission Outreach Church (M.O.C) is a small full-stack web application combining:
- An Express backend (`server.js`) handling APIs, file uploads, auth, and serving static files
- A client-side app (HTML/JS/CSS) for users and admins; front-end helpers in `backend.js`, `script.js` and page-level scripts in `index.html`, `login.html`, `admin-dashboard.html`, etc.
- MySQL database for persistent metadata (via `db.js` and `mysql2`)
- Media storage under `media/` for photos, videos, gallery icons

This document walks through the architecture, then explains each major file with emphasis on important functions, data flows, and extension points.

---

## Architecture & communication

- Client (browser) talks to server via `fetch()` to `/api/*` endpoints.
- The server exposes REST endpoints for uploads, fetching content, admin actions and stats.
- Files are stored under `media/` and served as static assets via `express.static(__dirname)`; range requests (for PDFs/videos) are supported by static-serving.
- Authentication:
  - Admin: validated against env variables `ADMIN_USER`/`ADMIN_PASS` or defaults. Successful login returns a token and sets an httpOnly cookie `admin_token`.
  - Users: simple token issued on login (placeholder logic) saved in `userSessions` map.
- Admin verification is done by checking tokens either in Authorization header (Bearer) or cookie via helper `getTokenFromReq`.

---

# File-by-file explanations (detailed)

The list below describes each important code file, what it does, and explains key code blocks and how they work. For very large files, highlights include the key functions you will work with.

---

## server.js (Backend entry)

Location: `server.js`

Purpose: The single entry-point for the backend server. It configures middleware, initializes the database and media directories, and registers all API endpoints.

Important parts and explanation:

- Configuration / constants
  - PORT: `const PORT = process.env.PORT || 3001;`
  - Admin credentials: read from `process.env.ADMIN_USER` / `ADMIN_PASS` with default `admin` / `letmein`.

- Middleware & static serving
  - `app.use(express.json())` for JSON parsing
  - `app.use(cookieParser())` for reading cookies
  - `app.use(express.static(__dirname))` to expose project files and `media/` folder

- Session storage
  - `const adminSessions = new Map();` and `const userSessions = new Map();` — ephemeral token stores for logged-in sessions. Each stores creation timestamp and optional metadata.
  - In production, swap out for persistent store (Redis) or DB.

- Admin login endpoint

```js
app.post('/api/admin/login', express.json(), (req, res) => {
  const { user, password } = req.body || {};
  const ADMIN_USER = process.env.ADMIN_USER || 'admin';
  const ADMIN_PASS = process.env.ADMIN_PASS || 'letmein';
  if (user === ADMIN_USER && password === ADMIN_PASS) {
    const token = crypto.randomBytes(24).toString('hex');
    adminSessions.set(token, { created: Date.now() });
    res.cookie('admin_token', token, { httpOnly: true, sameSite: 'lax' });
    return res.json({ success: true, token });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
});
```

- User login endpoint
  - Accepts email and password and returns a generated token; placeholder for DB validation.

- File upload endpoints
  - Use `multer` to handle multipart file uploads (video/photo/gallery icon uploads)
  - Files saved in `media/` subfolders; metadata is stored in DB tables via `db.js`.

- Admin endpoints (protected, using helper `requireAdmin` or checking token)
  - Return lists of pending content (`/api/admin/photos`, `/api/admin/videos`)
  - Accept approve/deny actions via `PATCH /api/videos/:id/approve` and similar

- Helper functions
  - `getTokenFromReq(req)` reads Bearer token from `Authorization` header or `admin_token` cookie
  - `requireAdmin`/`requireUser` middleware check token validity against session maps

Notes:
- For real-world systems, use proper password storage, create a user table, add token expiry and refresh logic, and use HTTPS.

---

## db.js

Location: `db.js`

Purpose: Provides an abstraction layer over the MySQL database. It handles creating tables and running queries for videos, photos, gallery icons, messages, and stats.

Key aspects:
- Exports methods to initialize DB and to CRUD records.
- Uses `mysql2` for MySQL driver.

Notes:
- If migrating to another database, update this module to keep the same interface for the rest of the app.

---

## backend.js (Frontend helper)

Location: `backend.js` (client-side JS)

Purpose: Houses admin UI helpers and client-side logic that interfaces with the server API. This keeps page scripts lightweight and centralizes admin-related behaviors.

Key functions and explanation:

- `loadAdminContent()`
  - Calls `/api/admin/videos`, `/api/admin/photos`, and `/api/messages` in parallel and populates an in-memory `database` object used to render lists.
  - Adds robust error handling and uses `parseJSONSafe` when parsing JSON responses to avoid `JSON.parse` errors when responses are empty or invalid.

- `toggleAdminPanel()` and `showAdminLoginPanel()`
  - `toggleAdminPanel()` calls `/api/admin/auth` to check server-side auth; if authenticated, it shows the admin panel and calls `renderAdminLists()`.
  - `showAdminLoginPanel()` shows an inline login form handled entirely via JavaScript and uses the API to authenticate.

- Approve/delete functions
  - `approveVideo(id)`, `approvePhoto(id)`, `deleteVideo(id)`, `deletePhoto(id)` call the appropriate API endpoints and re-fetch admin lists on success.

- Defensive JSON parsing helper
  - `parseJSONSafe(res)` reads response as text first; if empty returns {}. If text exists, tries `JSON.parse`, returns an error object with raw text on failure — prevents "JSON.parse: unexpected end of data" errors.


---

## script.js (General frontend utility)

Location: `script.js`

Purpose: Reusable UI helper functions used across pages: hamburger toggle, smooth scroll, form validation, etc.

Highlights:
- Mobile menu toggle that transforms hamburger icon via CSS and JS
- Intersection Observer animations for entry transitions
- Contact form handling with client-side validation

This file is intentionally small and not tied to server-side logic.

---

## index.html (Public site)

Location: `index.html`

Purpose: Main public site with gallery, modals, upload controls, and JavaScript integrating `backend.js` and `script.js`.

Key parts to read:
- Gallery loading: Fetches `/api/gallery-icons` to populate gallery grid.
- Uploads: `uploadPhotos`, `uploadVideos`, `uploadYouTube` functions that post to server endpoints. They set `Authorization` header with `user_token` when uploading.
- Login modals: Both user and admin login flows are implemented inline; they call `/api/user/login` and `/api/admin/login` respectively and handle responses with `parseJSONSafe`.

Notes:
- Make sure `API_BASE` is correct when moving frontend to a different origin; by default it's `''` so it uses same host as served files.

---

## login.html

Location: `login.html`

Purpose: Dedicated login page for both users and admins. Contains more explicit login form logic and post-login redirects.

Important script behaviors:
- On successful admin login, stores `admin_token` and redirects to `/admin-dashboard.html`.
- Auto-login if token exists and `user_type` is stored in sessionStorage.

---

## admin-dashboard.html & admin.html

Location: `admin-dashboard.html`, `admin.html`

Purpose: Admin interfaces for stats, messages, approvals, and content management.

Key behaviors:
- Both check for `admin_token` in `sessionStorage` on load and redirect to login if missing
- Fetch stats from `/api/stats` and pending items using protected endpoints
- Implement approval UX with confirm dialogs and feedback messages

Accessibility & UI notes:
- Pages are responsive and use simple DOM manipulation for content; they could be refactored to a modern framework for larger-scale features.

---

## user-portal.html

Location: `user-portal.html`

Purpose: Logged-in user uploads and lists their content. Uses `fetch` to send `FormData` to the server for photos and videos.

Key code:
- Upload functions check for `user_token` and show login prompt if missing
- Lists content and provides simple status indicators for pending/approved

---

## package.json

Location: `package.json`

Important scripts:
- `start`: node server.js
- `dev`: nodemon server.js
- `serve`: uses `http-server` to serve static site for testing

Dependencies include: `express`, `multer`, `mysql2`, `nodemailer`, `dotenv`, `cors`.

---

## Other files and folders

- `.env.example` - shows required environment variables (DB credentials, PORT, ADMIN_USER, ADMIN_PASS)
- `media/` - contains subfolders for `icons/`, `photos/`, `videos/` (store uploaded media here)
- `moc-data.json` - sample data; used in local development

---

## Debugging tips (common pitfalls)

- JSON.parse errors: Use `parseJSONSafe` client-side or ensure server returns valid JSON with correct status codes.
- Port conflicts: change PORT in `.env` or stop existing service using the port.
- Upload issues: ensure `media/*` directories exist and express has permissions to write files.

---

## How to read code effectively

- Start with `server.js` to understand API shape and routes.
- Inspect `db.js` to see table structure and queries.
- Open `index.html` and `backend.js` to follow client-side flows: what the client posts and renders.
- Use browser DevTools Network tab to observe API calls and responses.

---

If you want a fuller, line-by-line annotation for specific files (e.g., `server.js` or `backend.js`) I can add that as separate sections or create a downloadable version.


---

*End of document*
