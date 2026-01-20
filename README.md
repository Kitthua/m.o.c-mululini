# Mission Outreach Church (M.O.C) - Website

A modern, responsive church website for Mission Outreach Church built with HTML, CSS, JavaScript, and Node.js backend.

## 🙏 Church Information

**Name:** Mission Outreach Church (M.O.C)  
**Location:** 150 meters from Mululini Market, ~3 km from Kyusyani Market, Nairobi, Kenya  
**Leaders:** Rev. Jacob Musyoka & Favoured Grace Syuki

### Service Times
- **Main Service:** Every Sunday, 10:00 AM - 2:00 PM
- **Clinic Services:** Every Thursday
- **Choir Practice:** Every Thursday, 4:00 PM
- **Monthly Kesha (Prayer):** Last Friday of each month (Overnight)

### Contact Information
- **WhatsApp:** +254 705 961 358
- **Email:** shadrackithua75@gmail.com

## 📋 Features

### Frontend
✅ Responsive design (mobile, tablet, desktop)  
✅ Navigation menu with smooth scrolling  
✅ Hero section with church information  
✅ Location & leadership information  
✅ About section with vision, mission, and values  
✅ Services & events schedule  
✅ Photo gallery upload form  
✅ Video submission form (YouTube integration)  
✅ Contact form with validation  
✅ Social media links  
✅ Footer with all contact details  

### Backend
✅ Express.js server for form handling  
✅ Email notifications (Nodemailer)  
✅ Data persistence with JSON database  
✅ API endpoints for submissions  
✅ Message management system  
✅ Video and photo submission tracking  

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)
- Modern web browser

### Step 1: Navigate to Project Directory
```bash
cd "c:\Users\shadrack\hossptal\ecormmerce hospital\frontend\mululini church"
```

### Step 2: Install Dependencies
```bash
npm install
```

This will install:
- `express` - Web server framework
- `cors` - Cross-origin resource sharing
- `nodemailer` - Email sending
- `nodemon` - Auto-reload during development

### Step 3: Configure Email (Optional)
Edit the environment variables in `server.js` or create a `.env` file:
```
EMAIL_USER=shadrackithua75@gmail.com
EMAIL_PASSWORD=your_app_password_here
```

**For Gmail:**
1. Enable 2-Factor Authentication
2. Generate an App Password
3. Use the App Password in the EMAIL_PASSWORD field

### Step 4: Start the Server
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

The server will run on `http://localhost:3001`

### Step 5: Open in Browser
```bash
npm run serve
```

Then open `http://localhost:8000` in your browser

## 📁 Project Structure

```
mululini church/
├── index.html              # Main HTML file
├── styles.css              # CSS styling
├── script.js               # Frontend JavaScript
├── backend.js              # Frontend backend integration
├── server.js               # Node.js Express server
├── package.json            # Node.js dependencies
├── moc-data.json           # Database file (created automatically)
└── README.md               # This file
```

## 🔌 API Endpoints

### Contact Form Submission
```bash
POST /api/contact
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "0705961358",
  "subject": "Prayer Request",
  "message": "Please pray for..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "id": 1704321600000
}
```

### Get All Messages (Admin)
```bash
GET /api/messages
```

### Get Church Statistics
```bash
GET /api/stats
```

**Response:**
```json
{
  "totalMessages": 5,
  "unreadMessages": 2,
  "totalVideos": 10,
  "approvedVideos": 8,
  "totalPhotos": 25,
  "approvedPhotos": 20
}
```

## 💾 Data Storage

All submitted data is stored locally in `moc-data.json`:

### Messages
- Name, Email, Phone
- Subject, Message content
- Timestamp
- Read/Unread status

### Videos
- Title, YouTube URL
- Description, Uploader name
- Submission timestamp
- Approval status

### Photos
- Image name, Base64 encoded data
- Description, Uploader name
- Submission timestamp
- Approval status

## 🎨 Customization

### Colors
Edit the CSS variables in `styles.css`:
```css
:root {
    --primary-color: #1e3c72;      /* Dark blue */
    --secondary-color: #2a5298;    /* Medium blue */
    --accent-color: #f39c12;       /* Orange/Gold */
    --text-color: #333;
    --light-bg: #f8f9fa;
    --white: #ffffff;
}
```

### Contact Information
Update in `index.html`:
- WhatsApp number: Line with `wa.me/254705961358`
- Email address: Lines with `shadrackithua75@gmail.com`
- Church location: Location card sections
- Leadership names: Hero and location sections

### Service Times
Update in the "Services & Events" section in `index.html`

## 📧 Email Setup

### Using Gmail
1. Go to myaccount.google.com
2. Select "Security" from left menu
3. Enable 2-Step Verification
4. Create an App Password for "Mail" and "Windows"
5. Use this 16-character password in the configuration

### Using Other Email Providers
Update the transporter configuration in `server.js`:
```javascript
const transporter = nodemailer.createTransport({
    service: 'your-email-service',
    auth: {
        user: 'your-email@domain.com',
        pass: 'your-password'
    }
});
```

## 🔒 Security Features

- Input validation for all forms
- XSS protection with HTML escaping
- CORS enabled for API endpoints
- Email verification before sending notifications
- Read/Unread message tracking
- Approval workflow for media submissions

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🐛 Troubleshooting

### Port Already in Use
If port 3001 or 8000 is already in use:
```bash
# Change port in server.js or use environment variable
PORT=3005 npm start
```

### Email Not Sending
1. Check email credentials in `server.js`
2. Verify 2-Factor Authentication is enabled (for Gmail)
3. Use App Password instead of regular password
4. Check firewall/antivirus settings

### Photos Not Uploading
1. Clear browser cache
2. Check browser console for errors
3. Verify localStorage is enabled
4. Check available disk space

### Videos Not Displaying
1. Ensure YouTube URL is valid and public
2. Check internet connection
3. Try refreshing the page

## 📞 Contact & Support

For issues with the website:
- **WhatsApp:** +254 705 961 358
- **Email:** shadrackithua75@gmail.com

For technical support:
- Review the console errors (F12 in browser)
- Check server logs when running
- Refer to the troubleshooting section above

## 📄 License

This website is created for Mission Outreach Church (M.O.C)  
© 2026 All Rights Reserved

## ✨ Features Roadmap

- [ ] Mobile app version
- [ ] Online giving/donations system
- [ ] Sermon archive and search
- [ ] Live streaming integration
- [ ] Prayer request management
- [ ] Member directory
- [ ] Event calendar/ticketing
- [ ] Multi-language support
- [ ] Social media integration

---

**Last Updated:** January 2026  
**Made with ❤️ for Mission Outreach Church**
