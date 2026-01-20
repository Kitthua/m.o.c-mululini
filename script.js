// Mobile Menu Toggle
const mobileToggle = document.getElementById('mobileToggle');
const navMenu = document.getElementById('navMenu');

mobileToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    
    // Animate hamburger menu
    const spans = mobileToggle.querySelectorAll('span');
    spans[0].style.transform = navMenu.classList.contains('active') ? 'rotate(45deg) translate(10px, 10px)' : 'none';
    spans[1].style.opacity = navMenu.classList.contains('active') ? '0' : '1';
    spans[2].style.transform = navMenu.classList.contains('active') ? 'rotate(-45deg) translate(7px, -7px)' : 'none';
});

// Close mobile menu when clicking on a link
const navLinks = navMenu.querySelectorAll('a');
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        const spans = mobileToggle.querySelectorAll('span');
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
    });
});

// Smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Contact Form Submission
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Get form values
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const message = document.getElementById('message').value;
        
        // Simple validation
        if (name && email && message) {
            // Here you would typically send the form data to a server
            alert(`Thank you for your message, ${name}! We will get back to you soon.`);
            contactForm.reset();
        } else {
            alert('Please fill in all required fields.');
        }
    });
}

// Word count for message field
const messageField = document.getElementById('message');
const smallText = document.querySelector('.form-group small');

if (messageField) {
    messageField.addEventListener('input', () => {
        const words = messageField.value.trim().split(/\s+/).filter(word => word.length > 0).length;
        smallText.textContent = `${Math.min(words, 50)} of 50 max words`;
        
        if (words > 50) {
            messageField.value = messageField.value.split(/\s+/).slice(0, 50).join(' ');
        }
    });
}

// Add scroll animation to elements
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe cards for animation
document.querySelectorAll('.about-card, .sermon-card, .event-card, .membership-card, .info-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'all 0.6s ease';
    observer.observe(card);
});

// Navbar background on scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    } else {
        navbar.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
    }
});

// Active nav link on scroll
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-menu a');
    
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').slice(1) === current) {
            link.classList.add('active');
        }
    });
});

// Add active state styling
const style = document.createElement('style');
style.textContent = `
    .nav-menu a.active {
        color: #f39c12;
        border-bottom: 2px solid #f39c12;
        padding-bottom: 3px;
    }
`;
document.head.appendChild(style);

// Admin Panel Toggle - Handled by backend.js
// (delegated to backend.js for auth support)

// Admin Navigation Tabs - Handled by backend.js

// Admin content loading handled by backend.js

// Admin helper functions moved to backend.js

// Video Upload Method Toggle
document.querySelectorAll('input[name="uploadMethod"]').forEach(radio => {
    radio.addEventListener('change', () => {
        const youtubeInput = document.getElementById('youtubeInput');
        const fileInput = document.getElementById('fileInput');
        const videoUrl = document.getElementById('videoUrl');
        
        if (radio.value === 'youtube') {
            youtubeInput.style.display = 'block';
            fileInput.style.display = 'none';
            videoUrl.required = true;
        } else {
            youtubeInput.style.display = 'none';
            fileInput.style.display = 'block';
            videoUrl.required = false;
        }
    });
});

// Drag and drop for video upload
const videoUploadArea = document.getElementById('videoUploadArea');
const videoFileInput = document.getElementById('videoFile');

if (videoUploadArea && videoFileInput) {
    videoUploadArea.addEventListener('click', () => {
        videoFileInput.click();
    });

    videoUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        videoUploadArea.style.backgroundColor = '#f0f0f0';
        videoUploadArea.style.borderColor = '#0b61ff';
    });

    videoUploadArea.addEventListener('dragleave', () => {
        videoUploadArea.style.backgroundColor = 'transparent';
        videoUploadArea.style.borderColor = '#ddd';
    });

    videoUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        videoUploadArea.style.backgroundColor = 'transparent';
        videoUploadArea.style.borderColor = '#ddd';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            videoFileInput.files = files;
        }
    });
}
